const LoginForm: React.FC = () => {
  return (
    <form className="bg-white">
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
        <input
          type="password"
          placeholder="Password"
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

      <a href="/matching">
        <button
          type="button"
          className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow-md transition"
        >
          Login
        </button>
      </a>
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
