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
      name: "user-ui-service",
      filename: "remoteEntry.js",
      exposes: {
        "./UserProfileCard": "./src/components/user-profile/UserProfileCard",
        "./ForgotPasswordForm": "./src/components/ForgotPasswordForm",
        "./LoginForm": "./src/components/LoginForm",
        "./OtpForm": "./src/components/OtpForm",
        "./SetDisplayNameForm": "./src/components/SetDisplayNameForm",
        "./SignUpForm": "./src/components/SignUpForm",
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
    port: 5177,
  },
});
