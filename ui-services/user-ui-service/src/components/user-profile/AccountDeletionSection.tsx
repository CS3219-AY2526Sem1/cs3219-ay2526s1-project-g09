import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../context/useAuth";
import { UserService } from "../../api/UserService";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AccountDeletionSection = () => {
  const { user, token, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!user || !token) {
      setMessage("You must be logged in to delete your account.");
      return;
    }

    if (!confirm("Are you sure? This action is irreversible.")) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Call backend
      await UserService.deleteUser(user.id, token);

      // Clear context + storage
      logout();

      // Redirect to landing page
      navigate("/");

      setMessage("Account deleted successfully.");
    } catch (err) {
      if (err instanceof Error) {
        setMessage(err.message || "Failed to delete account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Support Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 flex gap-4 justify-between items-center">
        <div>
          <CardTitle className="text-lg text-red-500 font-semibold">
            Delete my account
          </CardTitle>
          <CardDescription className="text-red-400">
            Permanently delete the account and remove access from all workspaces
          </CardDescription>
          {message && <p className="text-sm text-red-400 mt-2">{message}</p>}
        </div>
        <div className="w-[150px]">
          <Button
            variant="destructive"
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete account"}
          </Button>
        </div>
      </CardContent>
    </>
  );
};

export default AccountDeletionSection;
