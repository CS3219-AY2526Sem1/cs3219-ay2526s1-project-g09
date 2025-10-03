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
      name: "peerprep",
      remotes: {
        matchingUiService: "http://localhost:5174/assets/remoteEntry.js",
        questionUiService: "http://localhost:5175/assets/remoteEntry.js",
        collabUiService: "http://localhost:5176/assets/remoteEntry.js",
        userUiService: "http://localhost:5177/assets/remoteEntry.js",
        historyUiService: "http://localhost:5178/assets/remoteEntry.js",
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
      "@peerprep/types": path.resolve(__dirname, "../shared/types"),
    },
  },
  server: {
    port: 5173,
  },
});
