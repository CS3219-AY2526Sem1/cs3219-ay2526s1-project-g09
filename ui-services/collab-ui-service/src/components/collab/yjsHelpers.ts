export const encodeUpdate = (update: Uint8Array) => {
  let binary = "";
  update.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

export const decodeUpdate = (encoded: unknown) => {
  if (encoded instanceof Uint8Array) {
    return encoded;
  }
  if (Array.isArray(encoded)) {
    return Uint8Array.from(encoded);
  }
  if (typeof encoded !== "string") {
    return null;
  }
  try {
    const decoded = atob(encoded);
    const buffer = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i += 1) {
      buffer[i] = decoded.charCodeAt(i);
    }
    return buffer;
  } catch (error) {
    console.warn("[yjsHelpers] Failed to decode Yjs update", error);
    return null;
  }
};

export const storageKeyFor = (
  sessionId: string | null,
  userId?: string | null,
) => {
  if (!sessionId || !userId) {
    return null;
  }
  return `collab-code:${sessionId}:${userId}`;
};
