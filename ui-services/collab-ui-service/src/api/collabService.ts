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

export const COLLAB_API_URL = DEFAULT_BASE_URL + "/api/v1/collab-service/";
