import AuthLayout from "@components/auth/AuthLayout";
import LoginForm from "userUiService/LoginForm";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <LoginForm onLoginSuccess={() => navigate("/matching")} />
    </AuthLayout>
  );
};

export default LoginPage;
