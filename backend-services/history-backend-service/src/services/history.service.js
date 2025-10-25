import SessionHistory from "../models/historyEntry.model.js";

const DEFAULT_LANGUAGE = "java";
const MAX_LIMIT = 100;

const sanitiseString = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitiseParticipants = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  const unique = new Set(
    input.map((entry) => sanitiseString(entry)).filter(Boolean),
  );
  return Array.from(unique);
};

const sanitiseQuestion = (question) => {
  if (!question || typeof question !== "object") {
    return null;
  }

  const questionId = sanitiseString(
    question.questionId ??
      question.id ??
      question._id?.toString?.() ??
      question.globalSlug ??
      question.slug,
  );

  if (!questionId) {
    return null;
  }

  return {
    questionId,
    title: sanitiseString(question.title ?? question.name) ?? "",
    difficulty: sanitiseString(question.difficulty) ?? "",
    topics: Array.isArray(question.topics)
      ? question.topics.map((topic) => sanitiseString(topic)).filter(Boolean)
      : [],
    timeLimit:
      typeof question.timeLimit === "number" ? question.timeLimit : undefined,
  };
};

export default class HistoryService {
  static async recordSnapshot(payload) {
    console.log("[history.service] recordSnapshot received payload", payload);
    const sessionId = sanitiseString(payload?.sessionId);
    const code =
      typeof payload?.code === "string" ? payload.code : payload?.codeSnapshot;
    const participants = sanitiseParticipants(payload?.participants);
    const question = sanitiseQuestion(payload?.question);
    const userId =
      sanitiseString(payload?.userId) ?? sanitiseString(payload?.savedBy);

    if (!sessionId) {
      throw new Error("sessionId is required");
    }

    if (!code) {
      throw new Error("code is required");
    }

    if (!userId) {
      throw new Error("userId is required");
    }

    if (!participants.includes(userId)) {
      participants.unshift(userId);
    }

    if (!question) {
      throw new Error("question information is required");
    }

    const update = {
      participants,
      question,
      code,
      language:
        sanitiseString(payload?.language)?.toLowerCase() ?? DEFAULT_LANGUAGE,
      savedBy: sanitiseString(payload?.savedBy) ?? userId,
      sessionEndedAt: payload?.sessionEndedAt
        ? new Date(payload.sessionEndedAt)
        : undefined,
      metadata: payload?.metadata ?? undefined,
    };

    console.log("[history.service] Upserting history entry", {
      sessionId,
      userId,
      update,
    });

    const result = await SessionHistory.findOneAndUpdate(
      { sessionId, userId },
      { $set: update },
      { new: true, upsert: true, runValidators: true },
    ).lean();

    console.log("[history.service] Upsert complete", result);
    return result;
  }

  static async getHistoryById(id) {
    return await SessionHistory.findById(id).lean();
  }

  static async listHistory(filters = {}, options = {}) {
    const query = {};

    if (filters.sessionId) {
      const sessionId = sanitiseString(filters.sessionId);
      if (sessionId) {
        query.sessionId = sessionId;
      }
    }

    if (filters.userId) {
      const userId = sanitiseString(filters.userId);
      if (userId) {
        query.userId = userId;
      }
    }

    if (filters.questionId) {
      const questionId = sanitiseString(filters.questionId);
      if (questionId) {
        query["question.questionId"] = questionId;
      }
    }

    const limit = Math.min(
      Number.parseInt(options.limit ?? filters.limit ?? 20, 10) || 20,
      MAX_LIMIT,
    );
    const skip = Math.max(
      Number.parseInt(options.skip ?? filters.skip ?? 0, 10) || 0,
      0,
    );

    const sort =
      typeof options.sort === "object"
        ? options.sort
        : { sessionEndedAt: -1, createdAt: -1 };

    const [items, total] = await Promise.all([
      SessionHistory.find(query).sort(sort).skip(skip).limit(limit).lean(),
      SessionHistory.countDocuments(query),
    ]);

    return { items, total, limit, skip };
  }
}
