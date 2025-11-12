const isDev = import.meta.env.VITE_MODE === "dev";

const DEFAULT_BASE_URL = isDev
  ? "http://localhost:5276"
  : "https://d2zqikej7k9p0j.cloudfront.net";

export const BASE_URL = DEFAULT_BASE_URL;

const WS1_OVERRIDE = import.meta.env.VITE_COLLAB_SOCKET_WS1 ?? "";
const WS2_OVERRIDE = import.meta.env.VITE_COLLAB_SOCKET_WS2 ?? "";

export const SOCKET_BASE_URL = DEFAULT_BASE_URL;
export const SOCKET_WS1_BASE_URL = WS1_OVERRIDE;
export const SOCKET_WS2_BASE_URL = WS2_OVERRIDE;

const API_PATH_PREFIX = "/api/v1/collab-service/";

type ApiTarget = {
  id: string;
  label: string;
  base: string;
  pathPrefix: string;
};

const PRIMARY_API_TARGET: ApiTarget = {
  id: "primary",
  label: "primary",
  base: DEFAULT_BASE_URL,
  pathPrefix: "",
};

const normaliseIoHint = (rawHint: string | null): "ws1" | "ws2" | null => {
  if (!rawHint) {
    return null;
  }
  const hint = rawHint.toLowerCase();
  if (hint === "2" || hint === "ws2") {
    return "ws2";
  }
  if (hint === "1" || hint === "ws1") {
    return "ws1";
  }
  return null;
};

const createDevTarget = (
  id: "ws1" | "ws2",
  fallbackPrefix: string,
  overrideBase: string,
): ApiTarget => {
  if (overrideBase) {
    return {
      id,
      label: id,
      base: overrideBase,
      pathPrefix: "",
    };
  }
  return {
    id,
    label: id,
    base: "",
    pathPrefix: fallbackPrefix,
  };
};

const resolveApiTargets = (): { targets: ApiTarget[] } => {
  if (typeof window === "undefined") {
    return { targets: [PRIMARY_API_TARGET] };
  }
  const inShellDev = window.location.port === "5173";
  if (!inShellDev) {
    return { targets: [PRIMARY_API_TARGET] };
  }

  const params = new URLSearchParams(window.location.search);
  const ioHint = normaliseIoHint(params.get("io"));
  const devTargets: ApiTarget[] = [
    createDevTarget("ws1", "/ws1", SOCKET_WS1_BASE_URL),
    createDevTarget("ws2", "/ws2", SOCKET_WS2_BASE_URL),
  ];
  if (ioHint) {
    const pinned = devTargets.find((target) => target.id === ioHint);
    if (pinned) {
      return { targets: [pinned] };
    }
  }
  return { targets: devTargets };
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, "");

const buildApiUrl = (target: ApiTarget, resourcePath: string) => {
  const suffix = trimLeadingSlash(resourcePath);
  const basePath = `${API_PATH_PREFIX}${suffix}`;
  if (target.base) {
    return `${trimTrailingSlash(target.base)}${basePath}`;
  }
  return `${target.pathPrefix}${basePath}`;
};

const shouldRetryResponse = (response: Response) =>
  [500, 502, 503, 504].includes(response.status);

export type CollabApiFetchOptions = RequestInit & {
  retryOnFailure?: boolean;
};

export const collabApiFetch = async (
  path: string,
  init?: CollabApiFetchOptions,
) => {
  const normalizedPath = trimLeadingSlash(path);
  const { targets } = resolveApiTargets();
  const attemptTargets = targets.length > 0 ? targets : [PRIMARY_API_TARGET];

  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (const target of attemptTargets) {
    const url = buildApiUrl(target, normalizedPath);
    try {
      const response = await fetch(url, init);
      if (response.ok) {
        return response;
      }
      if (init?.retryOnFailure === false || !shouldRetryResponse(response)) {
        return response;
      }
      lastResponse = response;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError ?? new Error("Collaboration API request failed.");
};

export const COLLAB_API_URL = DEFAULT_BASE_URL + API_PATH_PREFIX;
