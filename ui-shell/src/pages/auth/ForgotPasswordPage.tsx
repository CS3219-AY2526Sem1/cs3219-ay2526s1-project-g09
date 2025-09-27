import AuthLayout from "@components/auth/AuthLayout";
import ForgotPasswordForm from "userUiService/ForgotPasswordForm";
const ForgotPasswordPage: React.FC = () => {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
