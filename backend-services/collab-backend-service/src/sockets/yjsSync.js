// Lightweight Yjs document lifecycle helpers used by the socket handlers.
import * as Y from "yjs";
import { normaliseLanguage } from "../utils/session.utils.js";

const DEFAULT_LANGUAGE = "javascript";

const sessionCodeCache = new Map();
const sessionDocs = new Map();

const ensureSessionDoc = (sessionId) => {
  // Lazily create or return the in-memory Yjs document for a session. The doc
  // keeps itself in sync with the code cache via the `update` listener below.
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    return null;
  }

  let entry = sessionDocs.get(sessionId);
  if (entry) {
    entry.lastAccessed = Date.now();
    return entry;
  }

  const doc = new Y.Doc();
  doc.gc = true;
  const text = doc.getText("source");

  const newEntry = {
    doc,
    text,
    lastAuthor: undefined,
    language: DEFAULT_LANGUAGE,
    lastAccessed: Date.now(),
  };

  doc.on("update", () => {
    const content = text.toString();
    updateSessionCodeCache(
      sessionId,
      newEntry.lastAuthor,
      content,
      newEntry.language,
    );
  });

  const cached = getSessionCodeCache(sessionId);
  if (cached?.code) {
    newEntry.language = cached.language ?? DEFAULT_LANGUAGE;
    doc.transact(() => {
      text.insert(0, cached.code);
    }, "bootstrap-cache");
  }

  sessionDocs.set(sessionId, newEntry);
  return newEntry;
};

const destroySessionDoc = (sessionId) => {
  // Best-effort cleanup when a session is fully torn down. Errors are swallowed
  // because the GC hook is more of a memory hygiene measure than a hard
  // requirement for correctness.
  const entry = sessionDocs.get(sessionId);
  if (!entry) {
    return;
  }
  try {
    entry.doc.destroy();
  } catch (error) {
    console.warn(
      `[sessionLifecycle] Failed to destroy Yjs doc for ${sessionId}`,
      error,
    );
  }
  sessionDocs.delete(sessionId);
};

const getSessionSnapshot = (sessionId, socket) => {
  // Provide the freshest code/language pair we have. Prefer the live Yjs doc,
  // fall back to the cache, and finally consider socket metadata (useful right
  // after a client pushes an update).
  const docEntry = sessionDocs.get(sessionId);
  if (docEntry?.text) {
    return {
      code: docEntry.text.toString(),
      language: docEntry.language ?? DEFAULT_LANGUAGE,
    };
  }
  const cached = getSessionCodeCache(sessionId);
  const latestLanguage =
    socket?.data?.latestLanguage ?? cached?.language ?? DEFAULT_LANGUAGE;
  const code = socket?.data?.latestCode ?? cached?.code ?? null;
  return {
    code,
    language: latestLanguage,
  };
};

const updateSessionCodeCache = (sessionId, userId, code, language) => {
  // Persist the latest content in a simple in-memory map so disconnect and
  // inactivity handlers can run without touching the Yjs doc directly.
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    return;
  }
  if (typeof code !== "string") {
    return;
  }

  const entry = {
    code,
    language: normaliseLanguage(language) ?? DEFAULT_LANGUAGE,
    userId: typeof userId === "string" ? userId : undefined,
    updatedAt: Date.now(),
  };

  sessionCodeCache.set(sessionId, entry);
};

const getSessionCodeCache = (sessionId) => {
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    return null;
  }
  return sessionCodeCache.get(sessionId);
};

const clearSessionCodeCache = (sessionId) => {
  // Called once a snapshot has been persisted. Also tears down the in-memory
  // Yjs doc to prevent stale state hanging around between sessions.
  if (!sessionId) {
    return;
  }
  sessionCodeCache.delete(sessionId);
  destroySessionDoc(sessionId);
};

export {
  sessionCodeCache,
  sessionDocs,
  ensureSessionDoc,
  destroySessionDoc,
  getSessionSnapshot,
  updateSessionCodeCache,
  getSessionCodeCache,
  clearSessionCodeCache,
};
