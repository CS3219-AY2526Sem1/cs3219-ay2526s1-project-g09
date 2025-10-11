import { useState, useEffect } from "react";
import { UserService } from "@/api/UserService";

interface ForgotPasswordFormProps {
  onEmailSent?: () => void;
  errorType?: string | null;
  onClearError?: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onEmailSent,
  errorType,
  onClearError,
}) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (errorType === "invalid-link") {
      setLinkError("The password reset link you used is invalid or expired.");
      // clear router state after showing once
      if (onClearError) onClearError();
    }
  }, [errorType, onClearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await UserService.requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      console.error(err);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm text-center">
        <h2 className="text-lg font-semibold mb-2">Check your email</h2>
        <p className="text-gray-600">
          If an account exists with <strong>{email}</strong>, you’ll receive a
          password reset link shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            if (onEmailSent) onEmailSent();
          }}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow-md transition"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white">
      {linkError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
          {linkError}
        </div>
      )}

      <div className="space-y-4">
        <div className="text-center mb-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Forgot your password?
          </h2>
          <p className="text-gray-600 text-sm">
            It’s okay — it happens to the best of us. Just enter your registered
            email below, and we’ll help you reset it.
          </p>
        </div>
        <input
          type="email"
          placeholder="Registered Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow-md transition ${
          loading ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Sending..." : "Send Email"}
      </button>

      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
    </form>
  );
};

export default ForgotPasswordForm;
