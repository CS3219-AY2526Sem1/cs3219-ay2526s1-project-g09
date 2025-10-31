const isDev = import.meta.env.VITE_MODE === "dev";

export const CHAT_URL = isDev
  ? "http://localhost:5286"
  : "https://d2zqikej7k9p0j.cloudfront.net";

export interface MessagePayload {
  senderId: string;
  text: string;
}

export interface SystemMessagePayload {
  event: string;
  userId: string;
  username: string;
  text: string;
}
