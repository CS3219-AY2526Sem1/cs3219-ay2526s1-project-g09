import { useState } from "react";
import { UserService } from "../api/UserService";
import type { User } from "../api/UserService";

interface SignUpFormProps {
  onSignUpSuccess?: (user: User) => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSignUpSuccess }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();

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
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }

  return (
    <form
      className="bg-white"
      onSubmit={(e) => {
        e.preventDefault();
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
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
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
        <a href="/login" className="text-orange-500 hover:underline">
          Already have an account? Login
        </a>
      </div>
    </form>
  );
};

export default SignUpForm;
