import AuthLayout from "@components/auth/AuthLayout";
import LoginForm from "userUiService/LoginForm";

const LoginPage: React.FC = () => {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
