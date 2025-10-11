const ForgotPasswordForm: React.FC = () => {
  return (
    <form className="bg-white">
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Registered Email"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
      </div>

      <button
        type="button"
        className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow-md transition"
      >
        Send Email
      </button>
    </form>
  );
};

export default ForgotPasswordForm;
