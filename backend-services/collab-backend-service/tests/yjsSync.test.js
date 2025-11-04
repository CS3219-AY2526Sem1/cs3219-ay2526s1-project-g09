import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import {
  ensureSessionDoc,
  sessionDocs,
  sessionCodeCache,
  getSessionSnapshot,
  updateSessionCodeCache,
  getSessionCodeCache,
  clearSessionCodeCache,
} from "../src/sockets/yjsSync.js";

describe("yjsSync helpers", () => {
  beforeEach(() => {
    sessionDocs.clear();
    sessionCodeCache.clear();
  });

  it("creates and reuses session documents", () => {
    const entry = ensureSessionDoc("session-1");
    expect(entry).toBeDefined();
    expect(entry.doc).toBeInstanceOf(Y.Doc);

    const secondCall = ensureSessionDoc("session-1");
    expect(secondCall).toBe(entry);
  });

  it("ignores invalid session identifiers", () => {
    expect(ensureSessionDoc("")).toBeNull();
    expect(ensureSessionDoc("   ")).toBeNull();
    expect(ensureSessionDoc(null)).toBeNull();
  });

  it("updates the session cache when the Yjs document changes", () => {
    const entry = ensureSessionDoc("session-2");
    entry.lastAuthor = "user-123";
    entry.language = "python";

    entry.text.insert(0, "print('hi')");

    const cached = getSessionCodeCache("session-2");
    expect(cached).toMatchObject({
      code: "print('hi')",
      language: "python",
      userId: "user-123",
    });
  });

  it("hydrates a new document from cached content", () => {
    updateSessionCodeCache("session-3", "user", "cached code", "Ruby");

    const entry = ensureSessionDoc("session-3");
    expect(entry.text.toString()).toBe("cached code");
    expect(entry.language).toBe("ruby");
  });

  it("provides snapshots from live documents when available", () => {
    const entry = ensureSessionDoc("session-4");
    entry.language = "typescript";
    entry.text.insert(0, "let x = 1;");

    expect(getSessionSnapshot("session-4")).toEqual({
      code: "let x = 1;",
      language: "typescript",
    });
  });

  it("falls back to cache or socket metadata for snapshots", () => {
    updateSessionCodeCache("session-5", "user42", "cached content", " GoLang ");

    expect(getSessionSnapshot("session-5", null)).toEqual({
      code: "cached content",
      language: "golang",
    });

    const socketMock = {
      data: {
        latestCode: "socket code",
        latestLanguage: "kotlin",
      },
    };
    expect(getSessionSnapshot("session-6", socketMock)).toEqual({
      code: "socket code",
      language: "kotlin",
    });
  });

  it("clears both cache and document state for a session", () => {
    const entry = ensureSessionDoc("session-7");
    entry.text.insert(0, "cleanup test");
    updateSessionCodeCache("session-7", "user", "cleanup test", "Java");

    expect(sessionDocs.has("session-7")).toBe(true);
    expect(sessionCodeCache.has("session-7")).toBe(true);

    clearSessionCodeCache("session-7");

    expect(sessionDocs.has("session-7")).toBe(false);
    expect(sessionCodeCache.has("session-7")).toBe(false);
  });
});
