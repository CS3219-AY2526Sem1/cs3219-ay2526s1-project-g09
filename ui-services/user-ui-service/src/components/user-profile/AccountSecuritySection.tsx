import { useState, useEffect } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../context/useAuth";
import { validatePassword, validateEmail } from "../../utils/InputValidation";

const AccountSecuritySection = () => {
  const { user, updateUser } = useAuth();

  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Keep email in sync with context updates
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleChangeEmail = async () => {
    const error = validateEmail(email);
    if (error) {
      setMessage(error);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await updateUser({ email });
      setMessage("Email updated successfully!");
    } catch (err) {
      if (err instanceof Error) {
        setMessage(err.message || "Failed to update email");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const errors = validatePassword(password);
    if (errors.length > 0) {
      setMessage(errors);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await updateUser({ password });
      setPassword("");
      setMessage("Password updated successfully!");
    } catch (err) {
      if (err instanceof Error) {
        setMessage(err.message || "Failed to update password");
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
