import AuthLayout from "@components/auth/AuthLayout";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";
import { useLocation, useNavigate } from "react-router-dom";

const ForgotPasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { error?: string } | null;
  const errorType = state?.error || null;

  return (
    <AuthLayout>
      <RemoteWrapper
        remote={() => import("userUiService/ForgotPasswordForm")}
        remoteName="User UI Service"
        remoteProps={{
          errorType,
          onBackToLogin: () => navigate("/login"),
          onClearError: () =>
            navigate(location.pathname, { replace: true, state: {} }),
        }}
        loadingMessage="Loading forgot password form..."
        errorMessage="Forgot password service unavailable"
      />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
