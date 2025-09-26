import SessionService from "../services/session.service.js";

export const startSession = async (req, res) => {
  try {
    const { questionId, users } = req.body;

    if (!questionId || typeof questionId !== "string") {
      return res.status(400).json({ error: "questionId is required" });
    }

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "At least one user is required" });
    }

    const session = await SessionService.createSession({ questionId, users });

    const io = req.app?.locals?.io;
    if (io) {
      io.emit("sessionCreated", session);
      console.log(
        "Emitted sessionCreated event for session:",
        session.sessionId,
      );
    }

    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = await SessionService.endSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ success: true, session });
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

export const saveSnapshot = async (req, res) => {
  try {
    const { sessionId, code, language, userId } = req.body;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId is required" });
    }

    if (typeof code !== "string") {
      return res.status(400).json({ error: "code must be a string" });
    }

    const session = await SessionService.saveSnapshot({
      sessionId,
      code,
      language,
      userId,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found or inactive" });
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
