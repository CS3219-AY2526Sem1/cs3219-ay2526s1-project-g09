import AuthLayout from "@components/auth/AuthLayout";
import ResetPasswordForm from "userUiService/ResetPasswordForm";
const ResetPasswordPage: React.FC = () => {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
