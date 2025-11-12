import { useState } from "react";
import type { User } from "@/types/User";
import { UserService } from "@/api/UserService";
import { UserServiceApiError } from "@/api/UserServiceErrors";
import {
  validateUsername,
  validateEmail,
  validatePassword,
} from "../utils/InputValidation";
import { Eye, EyeOff } from "lucide-react";

interface SignUpFormProps {
  onSignUpSuccess?: (user: User) => void;
  onBackToLogin: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({
  onSignUpSuccess,
  onBackToLogin,
}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();

    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (usernameError || emailError || passwordError) {
      setError(usernameError || emailError || passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await UserService.register(username, email, password);
      console.log("Registered:", res.data);

      // Generate and send otp to email
      await UserService.sendOtp(email);

      const newUser = res.data;

      // Navigate to otp page
      onSignUpSuccess?.(newUser);
    } catch (err) {
      if (err instanceof Error || err instanceof UserServiceApiError) {
        setError(err.message);
      } else {
        setError("Failed to Signup. Please refresh and try again.");
      }
    }
  }

  return (
    <form
      className="bg-white"
      onSubmit={(e) => {
        handleSignUp(e);
      }}
    >
      <div className="space-y-4">
        <input
          type="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
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
            onClick={() => setShowPassword((prev) => !prev)}
            className="px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="inline-flex items-center w-full rounded-lg border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-400">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="flex-grow px-4 py-3 rounded-l-lg focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <button
        type="submit"
        className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow-md transition"
      >
        Create Account
      </button>
      <div className="flex items-center my-6">
        <hr className="flex-1 border-gray-300" />
        <span className="mx-2 text-gray-400 text-sm">or</span>
        <hr className="flex-1 border-gray-300" />
      </div>

      <div className="text-center">
        <button
          onClick={() => {
            onBackToLogin();
          }}
          className="text-orange-500 hover:underline focus:outline-none bg-transparent border-none cursor-pointer"
        >
          Already have an account? Login
        </button>
      </div>
    </form>
  );
};

export default SignUpForm;
