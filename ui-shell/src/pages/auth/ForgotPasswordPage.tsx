import AuthLayout from "@components/auth/AuthLayout";
import ForgotPasswordForm from "userUiService/ForgotPasswordForm";
import { useLocation, useNavigate } from "react-router-dom";

const ForgotPasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // read the passed state
  const state = location.state as { error?: string } | null;
  const errorType = state?.error || null;

  return (
    <AuthLayout>
      <ForgotPasswordForm
        errorType={errorType}
        onEmailSent={() => {
          navigate("/login");
        }}
        onClearError={() =>
          navigate(location.pathname, { replace: true, state: {} })
        }
      />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
