import AuthLayout from "@components/auth/AuthLayout";
import ForgotPasswordForm from "userUiService/ForgotPasswordForm";
import { useLocation, useNavigate } from "react-router-dom";

const ForgotPasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // read the passed state
  const error = (location.state as { error?: string })?.error;

  return (
    <AuthLayout>
      {error === "invalid-link" && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
          The password reset link you used is invalid or expired. Please request
          a new one below.
        </div>
      )}

      <ForgotPasswordForm
        onEmailSent={() => {
          navigate("/login");
        }}
      />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
