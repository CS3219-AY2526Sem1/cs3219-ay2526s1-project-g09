import AuthLayout from "@components/auth/AuthLayout";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";
import { useNavigate } from "react-router-dom";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <RemoteWrapper
        remote={() => import("userUiService/ResetPasswordForm")}
        remoteName="User UI Service"
        remoteProps={{
          onResetSuccess: () => navigate("/login"),
          onTokenInvalid: () =>
            navigate("/forgotPassword", {
              replace: true,
              state: { error: "invalid-link" },
            }),
        }}
        loadingMessage="Loading reset form..."
        errorMessage="Reset password service unavailable"
      />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
