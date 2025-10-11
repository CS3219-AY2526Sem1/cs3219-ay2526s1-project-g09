import AuthLayout from "@components/auth/AuthLayout";
import ResetPasswordForm from "userUiService/ResetPasswordForm";
import { useNavigate } from "react-router-dom";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <ResetPasswordForm
        onResetSuccess={() => {
          // After successful password reset, navigate to login
          navigate("/login");
        }}
        onTokenInvalid={() =>
          navigate("/forgotPassword", {
            replace: true,
            state: { error: "invalid-link" },
          })
        }
      />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
