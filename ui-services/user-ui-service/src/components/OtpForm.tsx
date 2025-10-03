import { useState } from "react";
import type { User } from "@/types/User";
import { UserService } from "@/api/UserService";
import { UserServiceApiError } from "@/api/UserServiceErrors";

interface OtpFormProps {
  user: User;
  onOTPSuccess?: (user: User) => void;
}

const OtpForm: React.FC<OtpFormProps> = ({ user, onOTPSuccess }) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string, index: number) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    console.log("Verifying OTP:", code);
    try {
      const res = await UserService.verifyOtp(user.email, code);

      onOTPSuccess?.(res.data);
    } catch (err) {
      if (err instanceof UserServiceApiError) {
        console.error("API Error: ", err);
        setError("API Error. Please refresh the page and try again.");
      } else {
        console.error("OTP verification failed:", err);
        setError(
          "Invalid or Expired OTP. Try resending the code and verify again.",
        );
      }
    }
  };

  return (
    <div className="text-center">
      {/* Title */}
      <h2 className="text-xl font-semibold mb-2">Verification Code</h2>
      <p className="text-gray-500 mb-6">
        We have sent a verification code to your email address
      </p>

      {/* OTP Inputs */}
      <form
        onSubmit={(e) => {
          handleSubmit(e);
        }}
      >
        <div className="flex justify-center space-x-3 mb-4">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, i)}
              className="w-12 h-12 border border-gray-300 rounded-lg text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {/* Resend link */}
        <p className="text-sm text-gray-500 mb-6">
          Didn’t receive the code?{" "}
          <button
            type="button"
            onClick={() => console.log("Resend OTP")}
            className="text-orange-600 font-medium hover:underline"
          >
            Resend it
          </button>
        </p>

        <button
          type="submit"
          className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition"
        >
          Verify OTP
        </button>
      </form>
    </div>
  );
};

export default OtpForm;
