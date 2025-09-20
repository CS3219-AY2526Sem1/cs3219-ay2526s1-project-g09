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
        "./QuestionDisplay": "./src/components/QuestionDisplay",
        "./AnswerButton": "./src/components/AnswerButton",
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
    port: 5175,
  },
});
