import SessionService from "../services/session.service.js";
import { persistSessionHistory } from "../services/sessionHistory.service.js";

const QUESTION_SERVICE_BASE_URL = process.env.QUESTION_SERVICE_URL;

const VALID_DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);

const normalisePreferences = (input) => {
  if (!input || typeof input !== "object") {
    return {};
  }

  const normalised = {};
  for (const [topic, value] of Object.entries(input)) {
    if (!value) {
      continue;
    }
    let difficulties = [];
    if (Array.isArray(value)) {
      difficulties = value;
    } else if (value instanceof Set) {
      difficulties = Array.from(value);
    } else if (typeof value === "object") {
      difficulties = Object.values(value);
    }

    const filtered = Array.from(new Set(difficulties)).filter((entry) =>
      VALID_DIFFICULTIES.has(String(entry)),
    );

    if (filtered.length > 0) {
      normalised[topic] = filtered;
    }
  }
  return normalised;
};

const mapQuestionForSession = (question) => {
  if (!question || typeof question !== "object") {
    return null;
  }

  const questionId =
    question._id?.toString?.() ??
    question.questionId ??
    question.globalSlug ??
    question.id;

  if (!questionId) {
    return null;
  }

  return {
    questionId,
    title: question.title ?? "",
    body: question.content ?? question.body ?? "",
    difficulty: question.difficulty ?? "",
    topics: question.categoryTitle ? [question.categoryTitle] : [],
    hints: Array.isArray(question.hints) ? question.hints : [],
    answer: question.answer ?? "",
    timeLimit:
      typeof question.timeLimit === "number" ? question.timeLimit : undefined,
    raw: question,
  };
};

const fetchRandomQuestion = async (categories) => {
  const endpoint = `${QUESTION_SERVICE_BASE_URL}/random`;
  console.log(
    "Fetching random question from:",
    endpoint,
    "with categories:",
    categories,
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categories }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(
      `Failed to retrieve random question (${response.status}): ${errorText}`,
    );
  }

  return await response.json();
};

export const healthCheck = async (req, res) => {
  try {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

export const readinessCheck = async (_req, res) => {
  const questionServiceUrl = process.env.QUESTION_SERVICE_URL;
  const result = {
    service: "collab-service",
    status: "ok",
    dependencies: {},
    timestamp: new Date().toISOString(),
  };

  try {
    // try calling the Question Service health endpoint
    const healthUrl = `${questionServiceUrl}/health`;
    const response = await fetch(healthUrl, { method: "GET", timeout: 3000 });

    if (response.ok) {
      result.dependencies.questionService = "UP";
    } else {
      result.dependencies.questionService = `UNHEALTHY (status ${response.status})`;
      result.status = "degraded";
    }
  } catch (err) {
    result.dependencies.questionService = `DOWN (${err.message})`;
    result.status = "degraded";
  }

  const httpStatus = result.status === "ok" ? 200 : 503;
  res.status(httpStatus).json(result);
};

export const startSession = async (req, res) => {
  try {
    const {
      questionId: providedQuestionId,
      users,
      sessionId,
      questionPreferences,
    } = req.body ?? {};

    let resolvedQuestionId =
      typeof providedQuestionId === "string" && providedQuestionId.trim().length
        ? providedQuestionId.trim()
        : null;
    let questionPayload = null;

    const categories = normalisePreferences(questionPreferences);

    if (!resolvedQuestionId) {
      if (Object.keys(categories).length === 0) {
        return res.status(400).json({
          success: false,
          error: "questionId or valid questionPreferences is required",
        });
      }

      try {
        const randomQuestion = await fetchRandomQuestion(categories);
        questionPayload = mapQuestionForSession(randomQuestion);
        if (!questionPayload) {
          throw new Error("Received invalid question payload");
        }
        resolvedQuestionId = questionPayload.questionId;
      } catch (questionError) {
        console.error("Failed to fetch random question:", questionError);
        return res.status(502).json({
          success: false,
          error: "Unable to retrieve random question",
        });
      }
    }

    if (!resolvedQuestionId) {
      return res
        .status(400)
        .json({ success: false, error: "questionId is required" });
    }

    if (!Array.isArray(users) || users.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "At least one user is required" });
    }

    const session = await SessionService.createSession({
      questionId: resolvedQuestionId,
      users,
      sessionId,
      question: questionPayload,
    });

    const io = req.app?.locals?.io;
    if (io) {
      io.emit("sessionCreated", session);
      console.log(
        "Emitted sessionCreated event for session:",
        session.sessionId,
      );
    }

    res.status(201).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const connectSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId } = req.body ?? {};

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const { session, addedUser } = await SessionService.connectParticipant(
      sessionId,
      userId,
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found or user not part of session",
      });
    }

    res.json({ success: true, session, addedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const disconnectSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId, force } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const forceEnd = Boolean(force);

    const { session, ended, removedUser } =
      await SessionService.disconnectSession(sessionId, {
        userId,
        force: forceEnd,
      });

    if (!session) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    const io = req.app?.locals?.io;
    if (io) {
      if (ended) {
        io.to(session.sessionId).emit("sessionEnded", session.sessionId);
        console.log(
          "Emitted sessionEnded event for session:",
          session.sessionId,
        );
      } else if (removedUser) {
        io.to(session.sessionId).emit("participantLeft", {
          sessionId: session.sessionId,
          userId: removedUser,
        });
        console.log(
          "Emitted participantLeft event for session:",
          session.sessionId,
          "user:",
          removedUser,
        );
      }
    }

    const finalCode =
      typeof req.body?.finalCode === "string" ? req.body.finalCode : undefined;

    const participantIds = Array.from(
      new Set(
        [
          ...(Array.isArray(session.users) ? session.users : []),
          ...(Array.isArray(session.participants)
            ? session.participants.map((participant) => participant?.userId)
            : []),
        ]
          .filter((id) => typeof id === "string" && id.trim().length > 0)
          .map((id) => id.trim()),
      ),
    );

    const persistForUser = (targetId, options = {}) => {
      if (!targetId) {
        return;
      }

      const {
        clearSnapshot,
        sessionEndedAt,
        code: overrideCode,
        language: overrideLanguage,
      } = options;

      console.log("[collab.controller] Persisting history for user", {
        targetId,
        sessionId: session.sessionId,
        ended,
        removedUser,
        clearSnapshot,
      });

      const participantsForPayload =
        participantIds.length > 0 ? participantIds : [targetId];

      void persistSessionHistory(session, {
        code: overrideCode,
        language:
          overrideLanguage ??
          (typeof overrideCode === "string" ? req.body?.language : undefined),
        userId: targetId,
        participants: participantsForPayload,
        clearSnapshot,
        sessionEndedAt,
        sessionStartedAt: session.createdAt,
        durationMs: session.timeTaken,
      });
    };

    if (ended) {
      const uniqueParticipants =
        participantIds.length > 0 ? participantIds : [];

      let targets = [];
      if (forceEnd || (!userId && uniqueParticipants.length > 0)) {
        targets = uniqueParticipants;
      } else {
        targets = [userId].filter(Boolean);
        if (targets.length === 0 && uniqueParticipants.length > 0) {
          targets = uniqueParticipants;
        }
      }

      const sessionEndedAt = session.endedAt ?? new Date().toISOString();

      targets.forEach((participantId, index) => {
        persistForUser(participantId, {
          clearSnapshot: index === targets.length - 1,
          sessionEndedAt,
          code: finalCode,
        });
      });
    } else if (removedUser) {
      console.log("[collab.controller] Persisting history for removed user", {
        removedUser,
        sessionId: session.sessionId,
      });
      persistForUser(removedUser, {
        clearSnapshot: false,
        code: finalCode,
      });
    }

    res.json({
      success: true,
      session,
      ended,
      removedUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await SessionService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getActiveSessionForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const session = await SessionService.findActiveSessionByUser(userId);

    if (!session) {
      return res.status(404).json({ error: "No active session found" });
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
