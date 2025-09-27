import AuthLayout from "@components/auth/AuthLayout";
import LoginForm from "userUiService/LoginForm";
import { useNavigate } from "react-router-dom";
import type { User } from "../../api/AuthService";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <LoginForm
        onLoginRequireOtp={(user: User) =>
          navigate("/otp", { state: { user } })
        }
        onLoginSuccess={() => navigate("/matching")}
      />
    </AuthLayout>
  );
};

export default LoginPage;
