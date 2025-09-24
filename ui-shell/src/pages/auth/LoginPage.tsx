import AuthLayout from "@components/auth/AuthLayout";
import LoginForm from "userUiService/LoginForm";
import { useNavigate } from "react-router-dom";
import type { User } from "userUiService/api/UserService";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <LoginForm
        onLoginRequireOtp={(user: User) =>
          navigate("/otp", { state: { user } })
        }
        // TODO: pass token and user info to matching page
        onLoginSuccess={() => navigate("/matching")}
      />
    </AuthLayout>
  );
};

export default LoginPage;
