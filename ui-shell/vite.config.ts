import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import federation from "@originjs/vite-plugin-federation";

// Returns a remote config that safely falls back if the remote cannot be fetched
function remoteUrl(url: string) {
  const fallbackModule =
    "data:text/javascript,export function init(){}; export function get(){return Promise.resolve(() => ({ default: () => null, __mfe_status: { isOffline: true } }))};";

  const externalPromise = `(new Promise((resolve) => {
    fetch('${url}')
      .then(res => {
        if (!res.ok) throw new Error('Remote not reachable: ${url}');
        resolve('${url}');
      })
      .catch((e) => {
        console.warn('[MFE Offline]', '${url}', e.message);
        resolve('${fallbackModule}');
      });
  }))`;

  return {
    external: externalPromise,
    externalType: "promise",
    format: "esm",
    from: "vite",
  };
}

export default defineConfig({
  build: { cssCodeSplit: false },
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: "peerprep",
      remotes: {
        matchingUiService: remoteUrl(
          "http://localhost:5174/assets/remoteEntry.js",
        ),
        questionUiService: remoteUrl(
          "http://localhost:5175/assets/remoteEntry.js",
        ),
        collabUiService: remoteUrl(
          "http://localhost:5176/assets/remoteEntry.js",
        ),
        userUiService: remoteUrl("http://localhost:5177/assets/remoteEntry.js"),
        historyUiService: remoteUrl(
          "http://localhost:5178/assets/remoteEntry.js",
        ),
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
});
