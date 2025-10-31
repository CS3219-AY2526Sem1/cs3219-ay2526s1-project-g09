const isDev = import.meta.env.VITE_MODE === "dev";

export const BASE_URL = isDev
  ? "http://localhost:5276"
  : "https://d2zqikej7k9p0j.cloudfront.net";

export const SOCKET_BASE_URL = BASE_URL;
export const COLLAB_API_URL = BASE_URL + "/api/v1/collab-service/";
