import AuthLayout from "@components/auth/AuthLayout";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";
import { useNavigate } from "react-router-dom";
import type { User } from "@/types/User";
import { useAuth } from "@/data/UserStore";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  return (
    <AuthLayout>
      <RemoteWrapper
        remote={() => import("userUiService/LoginForm")}
        remoteName="User UI Service"
        remoteProps={{
          onLoginRequireOtp: (user: User) => {
            setUser(user);
            navigate("/otp");
          },
          onLoginSuccess: (user: User) => {
            setUser(user);
            navigate("/matching");
          },
          onCreateAccount: () => navigate("/signup"),
          onForgotPassword: () => navigate("/forgotPassword"),
        }}
        loadingMessage="Loading login form..."
        errorMessage="Login service unavailable"
      />
    </AuthLayout>
  );
};

export default LoginPage;
