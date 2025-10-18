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

  static sanitizeUserId(userId) {
    if (typeof userId !== "string") {
      return null;
    }
    const trimmed = userId.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  static sanitizeUsers(users) {
    return Array.from(
      new Set(
        (users ?? [])
          .map((user) => (typeof user === "string" ? user.trim() : ""))
          .filter((user) => user.length > 0),
      ),
    );
  }

  static mapParticipants(sessionId, userIds) {
    const now = new Date();
    return userIds.map((userId) => ({
      userId,
      active: true,
      lastSeenAt: now,
      sessionId,
    }));
  }

  static toResponse(session) {
    if (!session) {
      return null;
    }

    // a data normalisation helper for session objects
    const plain =
      typeof session.toObject === "function"
        ? session.toObject({ versionKey: false })
        : session;

    if (!plain.users && Array.isArray(plain.participants)) {
      plain.users = plain.participants.map((participant) => participant.userId);
    }

    return plain;
  }

  static async createSession({ questionId, users, sessionId, question }) {
    const ensuredSessionId = sessionId
      ? this.validateSessionId(sessionId)
      : this.generateSessionId();

    const sanitizedUsers = this.sanitizeUsers(users);

    if (sanitizedUsers.length === 0) {
      throw new Error("At least one valid user is required");
    }

    const existingSession = await Session.findOne({
      active: true,
      "participants.userId": { $all: sanitizedUsers },
    });

    if (existingSession) {
      const activeParticipants =
        existingSession.participants?.filter(
          (participant) => participant.active,
        ) ?? [];

      const activeUserIds = activeParticipants.map(
        (participant) => participant.userId,
      );

      const coversAllUsers = sanitizedUsers.every((user) =>
        activeUserIds.includes(user),
      );

      if (
        coversAllUsers &&
        activeUserIds.length === sanitizedUsers.length &&
        existingSession.questionId === questionId
      ) {
        const now = new Date();
        let modified = false;

        existingSession.participants?.forEach((participant) => {
          if (!sanitizedUsers.includes(participant.userId)) {
            return;
          }

          if (!participant.active) {
            modified = true;
          }

          participant.active = true;
          participant.lastSeenAt = now;
          modified = true;
        });

        if (
          question &&
          (!existingSession.question ||
            existingSession.question?.questionId !== question.questionId)
        ) {
          existingSession.question = question;
          modified = true;
        }

        if (modified) {
          await existingSession.save();
        }

        return this.toResponse(existingSession);
      }
    }

    const session = await Session.create({
      questionId,
      question,
      participants: this.mapParticipants(ensuredSessionId, sanitizedUsers),
      sessionId: ensuredSessionId,
      active: true,
    });

    return this.toResponse(session);
  }

  static async getSession(sessionId) {
    const sanitizedSessionId = this.validateSessionId(sessionId);
    const session = await Session.findOne({ sessionId: sanitizedSessionId });
    return this.toResponse(session);
  }

  static async connectParticipant(sessionId, userId) {
    const sanitizedSessionId = this.validateSessionId(sessionId);
    const sanitizedUserId = this.sanitizeUserId(userId);

    if (!sanitizedUserId) {
      throw new Error("Invalid userId");
    }

    const session = await Session.findOne({ sessionId: sanitizedSessionId });
    if (!session) {
      return { session: null, addedUser: false };
    }

    const participants = Array.isArray(session.participants)
      ? session.participants
      : [];

    const participant = participants.find(
      (entry) => entry.userId === sanitizedUserId,
    );

    if (!participant) {
      return { session: null, addedUser: false };
    }

    const now = new Date();
    participant.active = true;
    participant.lastSeenAt = now;
    participant.sessionId = sanitizedSessionId;

    session.participants = participants;
    if (session.active === false) {
      session.active = true;
    }

    await session.save();

    return {
      session: this.toResponse(session),
      addedUser: false,
    };
  }

  static async markActive(sessionId, userId) {
    const sanitizedSessionId = this.validateSessionId(sessionId);
    const sanitizedUserId = this.sanitizeUserId(userId);

    if (!sanitizedUserId) {
      return;
    }

    await Session.updateOne(
      {
        sessionId: sanitizedSessionId,
        "participants.userId": sanitizedUserId,
      },
      {
        $set: {
          "participants.$.lastSeenAt": new Date(),
          "participants.$.active": true,
        },
      },
    );
  }

  static async removeParticipant(sessionId, userId) {
    return await this.disconnectSession(sessionId, { userId });
  }

  static async disconnectSession(sessionId, options = {}) {
    const sanitizedSessionId = this.validateSessionId(sessionId);
    const { userId, force = false } = options;

    const sanitizedUserId = this.sanitizeUserId(userId);
    const session = await Session.findOne({ sessionId: sanitizedSessionId });

    if (!session) {
      return { session: null, ended: false, removedUser: null };
    }

    const participants = Array.isArray(session.participants)
      ? session.participants
      : [];

    const now = new Date();
    let removedUser = null;

    if (sanitizedUserId) {
      const participant = participants.find(
        (entry) => entry.userId === sanitizedUserId,
      );

      if (participant && participant.active) {
        participant.active = false;
        participant.lastSeenAt = now;
        removedUser = sanitizedUserId;
      }
    }

    if (force) {
      for (const participant of participants) {
        if (participant.active) {
          participant.active = false;
          participant.lastSeenAt = now;
        }
      }
    }

    const remainingActive = participants.filter((participant) =>
      Boolean(participant.active),
    );

    const shouldEnd = force || remainingActive.length === 0;
    let ended = false;

    if (shouldEnd && session.active !== false) {
      session.active = false;
      session.endedAt = now;
      if (session.createdAt) {
        session.timeTaken = Math.max(
          0,
          session.endedAt.getTime() - session.createdAt.getTime(),
        );
      }
      ended = true;
    } else if (!shouldEnd && session.active === false) {
      session.active = true;
    }

    session.participants = participants;
    await session.save();
    return {
      session: this.toResponse(session),
      ended,
      removedUser,
    };
  }

  static async findActiveSessionByUser(userId) {
    const sanitizedUserId = this.sanitizeUserId(userId);
    if (!sanitizedUserId) {
      return null;
    }

    const sessionDoc = await Session.findOne({
      active: true,
      participants: {
        $elemMatch: {
          userId: { $eq: sanitizedUserId },
          active: true,
        },
      },
    });

    return this.toResponse(sessionDoc);
  }
}

export default SessionService;
