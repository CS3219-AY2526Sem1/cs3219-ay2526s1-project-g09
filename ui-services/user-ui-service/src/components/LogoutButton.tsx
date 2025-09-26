const LogoutButton: React.FC = () => {
  return (
    <a href="/">
      <button className="px-4 py-2 bg-black text-white rounded-lg shadow hover:bg-gray-800 transition">
        Logout
      </button>
    </a>
  );
};

export default LogoutButton;
