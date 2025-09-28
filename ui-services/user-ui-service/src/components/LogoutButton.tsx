import { useAuth } from "../context/useAuth";

interface LogOutButtonProps {
  onLogOutSuccess?: () => void;
}

const LogoutButton: React.FC<LogOutButtonProps> = ({ onLogOutSuccess }) => {
  const { logout } = useAuth();
  async function handleLogOut() {
    try {
      await logout();
      onLogOutSuccess?.();
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
      }
    }
  }

  return (
    <button
      onClick={handleLogOut}
      className="px-4 py-2 bg-black text-white rounded-lg shadow hover:bg-gray-800 transition"
    >
      Logout
    </button>
  );
};

export default LogoutButton;
