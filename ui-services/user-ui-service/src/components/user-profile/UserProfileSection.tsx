import { useState, useEffect } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateUsername } from "../../utils/InputValidation";
import type { User } from "../../types/User";
import { UserService } from "../../api/UserService";
import { UserServiceApiError } from "../../api/UserServiceErrors";

interface UserProfileSectionProps {
  user: User;
  onUserUpdated?: (user: User) => void;
}

const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  user,
  onUserUpdated,
}) => {
  const [displayName, setDisplayName] = useState(user.username);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDisplayName(user.username);
  }, [user]);

  const handleChangeDisplayName = async () => {
    const error = validateUsername(displayName);
    if (error) {
      setMessage(error);
      return;
    }
    setLoading(true);
    try {
      const res = await UserService.updateUser(user.id, {
        username: displayName,
      });
      setMessage("Display name updated successfully!");
      onUserUpdated?.(res.data);
    } catch (err) {
      if (err instanceof Error || err instanceof UserServiceApiError) {
        setMessage(err.message);
      } else {
        setMessage("Failed to update display name");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">User Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col w-[300px]">
            <label htmlFor="displayName" className="text-sm font-semibold">
              Display Name
            </label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-gray-900 border-gray-700 text-gray-200"
            />
          </div>
          <div className="w-[150px]">
            <Button
              variant="outline"
              className="w-full bg-gray-900 text-gray-200 hover:bg-gray-700 border-gray-700"
              onClick={handleChangeDisplayName}
              disabled={loading}
            >
              {loading ? "Saving..." : "Change display name"}
            </Button>
          </div>
        </div>
        {message && <p className="text-sm text-gray-400">{message}</p>}
      </CardContent>
    </>
  );
};

export default UserProfileSection;
