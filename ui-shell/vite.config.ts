import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import { defineConfig, loadEnv } from "vite";

import { remoteUrl, getRemoteUrls } from "./helpers/remote-config";

export default defineConfig(({ mode }) => {
  // Load mode from .env
  const env = loadEnv(mode, process.cwd(), "");
  const MODE = env.VITE_MODE || "production";

  // Get all remote URLs for this mode
  const {
    MATCHING_UI_URL,
    QUESTION_UI_URL,
    COLLAB_UI_URL,
    USER_UI_URL,
    HISTORY_UI_URL,
  } = getRemoteUrls(MODE);

  return {
    build: { cssCodeSplit: false },
    plugins: [
      react(),
      tailwindcss(),
      federation({
        name: "peerprep",
        remotes: {
          matchingUiService: remoteUrl(MATCHING_UI_URL),
          questionUiService: remoteUrl(QUESTION_UI_URL),
          collabUiService: remoteUrl(COLLAB_UI_URL),
          userUiService: remoteUrl(USER_UI_URL),
          historyUiService: remoteUrl(HISTORY_UI_URL),
        },
        shared: ["react", "react-dom", "react-router-dom"],
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@assets": path.resolve(__dirname, "./src/assets"),
      },
    },
    server: { port: 5173 },
  };
});
