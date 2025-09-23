import { useState } from "react";
import { UserService } from "../api/UserService";
import { useNavigate } from "react-router-dom";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleLogin() {
    try {
      const res = await UserService.login(email, password);
      console.log("Logged in: ", res.data.accessToken);

      // store the token (somehow)

      navigate("/matching");
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
    }
  }

  return (
    <form
      className="bg-white"
      onSubmit={(e) => {
        e.preventDefault(); // stop page reload
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

      <div className="flex items-center justify-between mt-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" className="form-checkbox" />
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
