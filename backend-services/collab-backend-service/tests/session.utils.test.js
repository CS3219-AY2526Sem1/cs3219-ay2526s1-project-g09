import { describe, expect, it } from "vitest";
import {
  encodeUpdateToBase64,
  decodeUpdateFromBase64,
  normaliseLanguage,
  getParticipantIds,
} from "../src/utils/session.utils.js";

describe("session.utils", () => {
  describe("encodeUpdateToBase64", () => {
    it("encodes Uint8Array to base64", () => {
      const buffer = Uint8Array.from([1, 2, 3]);
      expect(encodeUpdateToBase64(buffer)).toBe("AQID");
    });

    it("falls back to empty string when update missing", () => {
      expect(encodeUpdateToBase64(null)).toBe("");
      expect(encodeUpdateToBase64(undefined)).toBe("");
    });
  });

  describe("decodeUpdateFromBase64", () => {
    it("returns null for falsy input", () => {
      expect(decodeUpdateFromBase64(null)).toBeNull();
      expect(decodeUpdateFromBase64(undefined)).toBeNull();
      expect(decodeUpdateFromBase64("")).toBeNull();
    });

    it("passes through Uint8Array input", () => {
      const payload = Uint8Array.from([5, 6]);
      expect(decodeUpdateFromBase64(payload)).toBe(payload);
    });

    it("decodes from base64 string", () => {
      const decoded = decodeUpdateFromBase64("AQID");
      expect(decoded).toBeInstanceOf(Uint8Array);
      expect(Array.from(decoded)).toEqual([1, 2, 3]);
    });

    it("decodes from numeric array", () => {
      const decoded = decodeUpdateFromBase64([9, 10]);
      expect(decoded).toBeInstanceOf(Uint8Array);
      expect(Array.from(decoded)).toEqual([9, 10]);
    });

    it("returns null for unsupported input types", () => {
      expect(decodeUpdateFromBase64({})).toBeNull();
    });
  });

  describe("normaliseLanguage", () => {
    it("lowercases and trims input", () => {
      expect(normaliseLanguage("  PyThOn ")).toBe("python");
    });

    it("returns null for non-string values or empty strings", () => {
      expect(normaliseLanguage(123)).toBeNull();
      expect(normaliseLanguage("   ")).toBeNull();
    });
  });

  describe("getParticipantIds", () => {
    it("collects unique ids from users and participants", () => {
      const session = {
        users: [" alice ", "bob", null],
        participants: [{ userId: "carol" }, { userId: "bob" }, { userId: "" }],
      };

      expect(getParticipantIds(session)).toEqual([" alice ", "bob", "carol"]);
    });

    it("returns empty array when no identifiers present", () => {
      expect(getParticipantIds({})).toEqual([]);
    });
  });
});
