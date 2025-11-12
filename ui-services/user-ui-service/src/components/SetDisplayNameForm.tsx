const SetDisplayNameForm: React.FC = () => {
  return (
    <form className="bg-white">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-2">Display Name</h2>
        <p className="text-gray-500 mb-6">
          Choose a display name so your peers know who they’re collaborating
          with!
        </p>
        <input
          type="text"
          placeholder="Display Name"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm mb-6"
        />
        <a href="/matching">
          <button
            type="button"
            className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition"
          >
            Let's Get Started
          </button>
        </a>
      </div>
    </form>
  );
};

export default SetDisplayNameForm;
