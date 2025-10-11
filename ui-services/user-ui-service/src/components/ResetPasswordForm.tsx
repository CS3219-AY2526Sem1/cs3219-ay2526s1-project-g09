import { useState, useMemo, useEffect } from "react";
import { UserService } from "@/api/UserService";
import { Eye, EyeOff } from "lucide-react";

interface ResetPasswordFormProps {
  onResetSuccess?: () => void;
  onTokenInvalid?: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onResetSuccess,
  onTokenInvalid,
}) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);

  // Extract token from query string (?token=xyz)
  const token = useMemo(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get("token") || "";
  }, []);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValid(false);
        setChecking(false);
        if (onTokenInvalid) onTokenInvalid();
        return;
      }

      try {
        const { valid } = await UserService.validateResetToken(token);
        setValid(valid);

        if (!valid) {
          if (onTokenInvalid) onTokenInvalid();
        }
      } catch (err) {
        console.error("Token validation failed:", err);
        setValid(false);
        if (onTokenInvalid) onTokenInvalid();
      } finally {
        setChecking(false);
      }
    };

    validateToken();
  }, [token, onTokenInvalid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid reset link.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await UserService.resetPassword(token, password);
      setDone(true);
      if (onResetSuccess) onResetSuccess();
    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
        setError(err.message || "Failed to reset password.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Component while validating token
  if (checking) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm text-center">
        <p className="text-gray-600">Validating your reset link...</p>
      </div>
    );
  }

  // Invalid token case
  if (!valid) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm text-center">
        <h2 className="text-lg font-semibold text-red-600 mb-2">
          Invalid or Expired Link
        </h2>
        <p className="text-gray-600 mb-4">
          Please request a new password reset link.
        </p>
        <a
          href="/forgot-password"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Request New Link
        </a>
      </div>
    );
  }

  // Password reset Success
  if (done) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm text-center">
        <h2 className="text-lg font-semibold mb-2">
          Password Reset Successful
        </h2>
        <p className="text-gray-600 mb-4">
          You can now sign in with your new password.
        </p>
        <button
          type="button"
          onClick={() => {
            if (onResetSuccess) onResetSuccess();
          }}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition"
        >
          Back to App
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white">
      <div className="space-y-4">
        <div className="inline-flex items-center w-full rounded-lg border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-400">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-grow px-4 py-3 rounded-l-lg focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="inline-flex items-center w-full rounded-lg border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-400">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="flex-grow px-4 py-3 rounded-l-lg focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((prev) => !prev)}
            className="px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow-md transition ${
          loading ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Processing..." : "Change Password"}
      </button>
      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
    </form>
  );
};

export default ResetPasswordForm;
