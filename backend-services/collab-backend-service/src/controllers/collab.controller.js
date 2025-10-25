import SessionService from "../services/session.service.js";

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
          error: "Unable to retrieve random question",
          details: questionError.message,
        });
      }
    }

    if (!resolvedQuestionId) {
      return res.status(400).json({ error: "questionId is required" });
    }

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "At least one user is required" });
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
      session,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const connectSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId } = req.body ?? {};

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const { session, addedUser } = await SessionService.connectParticipant(
      sessionId,
      userId,
    );

    if (!session) {
      return res
        .status(404)
        .json({ error: "Session not found or user not part of session" });
    }

    res.json({ success: true, session, addedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const disconnectSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId, force } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const { session, ended, removedUser } =
      await SessionService.disconnectSession(sessionId, {
        userId,
        force: Boolean(force),
      });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
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
