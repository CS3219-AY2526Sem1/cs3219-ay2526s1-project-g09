import { ApiError } from "@/api/UserServiceErrors";
import { UserService } from "@/api/UserService";

interface LogOutButtonProps {
  onLogOutSuccess?: () => void;
}

const LogoutButton: React.FC<LogOutButtonProps> = ({ onLogOutSuccess }) => {
  async function handleLogOut() {
    try {
      await UserService.logout();
      onLogOutSuccess?.();
    } catch (err) {
      if (err instanceof Error || err instanceof ApiError) {
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
