import { useState } from "react";
import { UserService } from "../api/UserService";
import type { User } from "@peerprep/types";
import { ApiError } from "../api/UserServiceErrors";

interface LoginFormProps {
  onLoginSuccess?: (user: User) => void;
  onLoginRequireOtp?: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onLoginRequireOtp,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    try {
      const res = await UserService.login(email, password, rememberMe);
      if (!res.data.isVerified) {
        onLoginRequireOtp?.(res.data);
        return;
      }

      const user = res.data;

      // Notify parent
      onLoginSuccess?.(user);
    } catch (err) {
      if (err instanceof ApiError) {
        console.error(err.message);
        setError("API Error. Please refresh the page and try again.");
      } else if (err instanceof Error) {
        console.error(err.message);
        setError("Invalid credentials. Please try again.");
      }
    }
  }

  return (
    <form
      className="bg-white"
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <div className="flex items-center justify-between mt-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="form-checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span className="text-gray-600 text-sm">Remember me</span>
        </label>
        <a
          href="/forgotPassword"
          className="text-orange-500 text-sm hover:underline"
        >
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow-md transition"
      >
        Login
      </button>
      <div className="flex items-center my-6">
        <hr className="flex-1 border-gray-300" />
        <span className="mx-2 text-gray-400 text-sm">or</span>
        <hr className="flex-1 border-gray-300" />
      </div>

      <div className="text-center">
        <a href="/signup" className="text-orange-500 hover:underline">
          Create an account?
        </a>
      </div>
    </form>
  );
};

export default LoginForm;
