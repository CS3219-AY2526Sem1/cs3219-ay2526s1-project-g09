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
      name: "question-ui-service",
      filename: "remoteEntry.js",
      exposes: {
        "./AnswerButton": "./src/exports/AnswerButton",
        "./QuestionDisplay": "./src/exports/QuestionDisplayWindow",
        "./QuestionList": "./src/exports/QuestionList",
        "./QuestionDetails": "./src/exports/QuestionDetails",
        "./QuestionEdit": "./src/exports/QuestionEdit",
        "./QuestionAdd": "./src/exports/QuestionAdd",
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
  server: {
    port: 5175,
  },
});
