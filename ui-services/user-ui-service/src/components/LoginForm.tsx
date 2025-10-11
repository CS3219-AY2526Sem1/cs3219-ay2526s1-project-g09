import { useState } from "react";
import type { User } from "@/types/User";
import { UserService } from "@/api/UserService";
import { UserServiceApiError } from "@/api/UserServiceErrors";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  onLoginSuccess?: (user: User) => void;
  onLoginRequireOtp?: (user: User) => void;
  onCreateAccount: () => void;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onLoginRequireOtp,
  onCreateAccount,
  onForgotPassword,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      if (err instanceof UserServiceApiError) {
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
      className="bg-white w-full max-w-md mx-auto"
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
        <div className="inline-flex items-center w-full rounded-lg border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-400">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-grow px-4 py-3 rounded-l-lg focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
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
        <button
          onClick={() => {
            onForgotPassword();
          }}
          className="text-orange-500 hover:underline focus:outline-none bg-transparent border-none cursor-pointer"
        >
          Forgot password?
        </button>
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
        <button
          onClick={() => {
            onCreateAccount();
          }}
          className="text-orange-500 hover:underline focus:outline-none bg-transparent border-none cursor-pointer"
        >
          Create an account?
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
