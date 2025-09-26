import crypto from "crypto";
import Session from "../models/session.model.js";

const SESSION_ID_REGEX = /^[a-zA-Z0-9-_]+$/;

class SessionService {
  static generateSessionId() {
    return `sess-${crypto.randomUUID()}`;
  }

  static validateSessionId(sessionId) {
    if (typeof sessionId !== "string" || !SESSION_ID_REGEX.test(sessionId)) {
      throw new Error("Invalid sessionId");
    }
    return sessionId;
  }

  static toResponse(session) {
    if (!session) {
      return null;
    }
    return session.toObject({ versionKey: false });
  }

  static async createSession({ questionId, users, sessionId }) {
    const ensuredSessionId = sessionId
      ? this.validateSessionId(sessionId)
      : this.generateSessionId();

    const sanitizedUsers = Array.from(
      new Set(
        (users ?? [])
          .map((user) => (typeof user === "string" ? user.trim() : ""))
          .filter((user) => user.length > 0),
      ),
    );

    if (sanitizedUsers.length === 0) {
      throw new Error("At least one valid user is required");
    }

    const session = await Session.create({
      questionId,
      users: sanitizedUsers,
      sessionId: ensuredSessionId,
      active: true,
    });

    return this.toResponse(session);
  }

  static async getSession(sessionId) {
    const sanitizedSessionId = this.validateSessionId(sessionId);
    return await Session.findOne({ sessionId: sanitizedSessionId }).lean({
      virtuals: true,
    });
  }

  static async endSession(sessionId) {
    const sanitizedSessionId = this.validateSessionId(sessionId);

    const session = await Session.findOne({ sessionId: sanitizedSessionId });
    if (!session) {
      return null;
    }

    session.active = false;
    session.endedAt = new Date();
    if (session.createdAt) {
      session.timeTaken = Math.max(
        0,
        session.endedAt.getTime() - session.createdAt.getTime(),
      );
    }

    await session.save();
    return this.toResponse(session);
  }

  static async saveSnapshot({ sessionId, code, language, userId }) {
    const sanitizedSessionId = this.validateSessionId(sessionId);

    const session = await Session.findOne({
      sessionId: sanitizedSessionId,
      active: true,
    });
    if (!session) {
      return null;
    }

    session.lastSavedAttempt = {
      code,
      language,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    await session.save();
    return this.toResponse(session);
  }
}

export default SessionService;
