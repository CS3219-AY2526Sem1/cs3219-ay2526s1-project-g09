export const encodeUpdateToBase64 = (update) =>
  Buffer.from(update ?? new Uint8Array()).toString("base64");

export const decodeUpdateFromBase64 = (input) => {
  if (!input) {
    return null;
  }
  if (input instanceof Uint8Array) {
    return input;
  }
  if (Array.isArray(input)) {
    try {
      return Uint8Array.from(input);
    } catch (error) {
      console.warn("[sessionLifecycle] Failed to convert update array", error);
      return null;
    }
  }
  if (typeof input === "string") {
    try {
      return new Uint8Array(Buffer.from(input, "base64"));
    } catch (error) {
      console.warn("[sessionLifecycle] Failed to decode update string", error);
      return null;
    }
  }
  console.warn("[sessionLifecycle] Unsupported update payload type", {
    type: typeof input,
  });
  return null;
};

export const normaliseLanguage = (language) => {
  if (typeof language !== "string") {
    return null;
  }
  const trimmed = language.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

export const getParticipantIds = (session) => {
  const ids = [];

  if (Array.isArray(session?.users)) {
    ids.push(
      ...session.users.filter(
        (id) => typeof id === "string" && id.trim().length > 0,
      ),
    );
  }

  if (Array.isArray(session?.participants)) {
    ids.push(
      ...session.participants
        .map((participant) => participant?.userId)
        .filter((id) => typeof id === "string" && id.trim().length > 0),
    );
  }

  return Array.from(new Set(ids));
};
