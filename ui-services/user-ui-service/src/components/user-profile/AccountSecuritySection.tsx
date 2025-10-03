import { useState, useEffect } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validatePassword, validateEmail } from "../../utils/InputValidation";
import type { User } from "@/types/User";
import { UserService } from "@/api/UserService";
import { UserServiceApiError } from "@/api/UserServiceErrors";

interface AccountSecuritySectionProps {
  user: User;
  onUserUpdated?: (user: User) => void;
}

const AccountSecuritySection: React.FC<AccountSecuritySectionProps> = ({
  user,
  onUserUpdated,
}) => {
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setEmail(user.email);
  }, [user]);

  const handleChangeEmail = async () => {
    const error = validateEmail(email);
    if (error) {
      setMessage(error);
      return;
    }
    setLoading(true);
    try {
      const res = await UserService.updateUser(user.id, { email });
      setMessage("Email updated successfully!");
      onUserUpdated?.(res.data);
    } catch (err) {
      if (err instanceof Error || err instanceof UserServiceApiError) {
        setMessage(err.message);
      } else {
        setMessage("Failed to update email.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const errors = validatePassword(password);
    if (errors) {
      setMessage(errors);
      return;
    }
    setLoading(true);
    try {
      const res = await UserService.updateUser(user.id, { password });
      setPassword("");
      setMessage("Password updated successfully!");
      onUserUpdated?.(res.data);
    } catch (err) {
      if (err instanceof Error || err instanceof UserServiceApiError) {
        setMessage(err.message);
      } else {
        setMessage("Failed to update password.");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Account Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col w-[300px]">
            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-900 border-gray-700 text-gray-200"
            />
          </div>
          <div className="w-[150px]">
            <Button
              variant="outline"
              className="w-full bg-gray-900 text-gray-200 hover:bg-gray-700 border-gray-700"
              onClick={handleChangeEmail}
              disabled={loading}
            >
              {loading ? "Saving..." : "Change email"}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col w-[300px]">
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-900 border-gray-700 text-gray-200"
            />
          </div>
          <div className="w-[150px]">
            <Button
              variant="outline"
              className="w-full bg-gray-900 text-gray-200 hover:bg-gray-700 border-gray-700"
              onClick={handleChangePassword}
              disabled={loading}
            >
              {loading ? "Saving..." : "Change password"}
            </Button>
          </div>
        </div>
        {message && (
          <p className="text-sm text-gray-400 whitespace-pre-line">{message}</p>
        )}
      </CardContent>
    </>
  );
};

export default AccountSecuritySection;
