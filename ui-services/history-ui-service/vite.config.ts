import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  build: { cssCodeSplit: false },
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: "history-ui-service",
      filename: "remoteEntry.js",
      exposes: {
        "./QuestionHistoryTable":
          "./src/components/QuestionTable/QuestionHistoryTable",
        "./QuestionAttemptTable":
          "./src/components/AttemptTable/QuestionAttemptTable",
        "./NotesWindow": "./src/components/NotesWindow",
        "./SavedCodePanel": "./src/components/SavedCodePanel",
        "./HistoryApp": "./src/App",
      },
      remotes: {
        userUiService: "http://localhost:5177/assets/remoteEntry.js",
        questionUiService:
          process.env.VITE_QUESTION_UI_REMOTE ??
          (process.env.VITE_MODE === "dev"
            ? "http://localhost:5175/assets/remoteEntry.js"
            : "https://peerprep-question-ui-service.s3-website-ap-southeast-1.amazonaws.com/assets/remoteEntry.js"),
      },
      shared: ["react", "react-dom"],
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
  server: {
    port: 5178,
  },
});
