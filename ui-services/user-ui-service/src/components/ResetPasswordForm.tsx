const ResetPasswordForm: React.FC = () => {
  return (
    <form className="bg-white">
      <div className="space-y-4">
        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
        <input
          type="password"
          placeholder="Re-enter Password"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
      </div>

      <a href="/login">
        <button
          type="button"
          className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow-md transition"
        >
          Change Password
        </button>
      </a>
    </form>
  );
};

export default ResetPasswordForm;
