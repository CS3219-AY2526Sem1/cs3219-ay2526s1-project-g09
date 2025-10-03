import AuthLayout from "@components/auth/AuthLayout";
import LoginForm from "userUiService/LoginForm";
import { useNavigate } from "react-router-dom";
import type { User } from "@/types/User";
import { useAuth } from "@/data/UserStore";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth(); 

  return (
    <AuthLayout>
      <LoginForm
        onLoginRequireOtp={(user: User) => {
          setUser(user);
          navigate("/otp");
        }}
        onLoginSuccess={(user: User) => {
          setUser(user);
          navigate("/matching")
        }}
      />
    </AuthLayout>
  );
};

export default LoginPage;
