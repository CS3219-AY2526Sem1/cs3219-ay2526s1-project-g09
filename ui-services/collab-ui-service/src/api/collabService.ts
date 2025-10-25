export const BASE_URL =
  import.meta.env.VITE_MODE == "dev"
    ? "http://localhost:5276"
    : "http://peerprep-collab-service.ap-southeast-1.elasticbeanstalk.com";

export const SOCKET_BASE_URL = BASE_URL;
export const COLLAB_API_URL = BASE_URL + "/api/v1/collab-service/";
