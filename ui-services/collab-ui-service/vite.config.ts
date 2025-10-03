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
      name: "collab-ui-service",
      filename: "remoteEntry.js",
      exposes: {
        "./WorkingWindow": "./src/components/WorkingWindow",
        "./SessionHeader": "./src/components/SessionHeader",
        "./ChatWindow": "./src/components/chat/ChatWindow",
      },
      remotes: {
        userUiService: "http://localhost:5177/assets/remoteEntry.js",
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
      "@peerprep/types": path.resolve(__dirname, "../../shared/types"),
    },
  },
  server: {
    port: 5176,
  },
});
