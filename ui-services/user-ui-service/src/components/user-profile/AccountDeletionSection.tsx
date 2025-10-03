import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserService } from "@peerprep/api";
import { UserServiceApiError } from "@peerprep/api";
import { useState } from "react";
import type { User } from "@peerprep/types";

interface AccountDeletionSectionProps {
  user: User;
  onAccountDeleted?: () => void;
}

const AccountDeletionSection: React.FC<AccountDeletionSectionProps> = ({
  user,
  onAccountDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setMessage("");

      await UserService.deleteUser(user.id);
      await UserService.logout();

      // Redirect to landing page
      onAccountDeleted?.();

      setMessage("Account deleted successfully.");
    } catch (err) {
      if (err instanceof Error || err instanceof UserServiceApiError) {
        setMessage(err.message);
      } else {
        setMessage("Failed to delete account.");
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
          {!confirming ? (
            <Button
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setConfirming(true)}
            >
              Delete account
            </Button>
          ) : (
            <>
              <Button
                variant="destructive"
                className="w-full bg-red-700 hover:bg-red-800 text-white"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Confirm delete?"}
              </Button>
              <Button
                variant="outline"
                className="w-full border-gray-500 text-gray-200 hover:bg-gray-700"
                onClick={() => setConfirming(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </>
  );
};

export default AccountDeletionSection;
