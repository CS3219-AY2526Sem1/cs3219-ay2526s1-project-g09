import { useEffect } from "react";
import AuthLayout from "@components/auth/AuthLayout";
import ResetPasswordForm from "userUiService/ResetPasswordForm";
import { useNavigate } from "react-router-dom";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    const validFormat = token && /^[a-f0-9]{64}$/i.test(token);

    if (!validFormat) {
      navigate("/forgotPassword", {
        replace: true,
        state: { error: "invalid-link" },
      });
    }
  }, [navigate]);

  return (
    <AuthLayout>
      <ResetPasswordForm
        onResetSuccess={() => {
          // After successful password reset, navigate to login
          navigate("/login");
        }}
      />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
