import AuthLayout from "@components/auth/AuthLayout";
import { useNavigate } from "react-router-dom";
import type { User } from "@/types/User";
import { useAuth } from "@/data/UserStore";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  return (
    <AuthLayout>
      <RemoteWrapper
        remote={() => import("userUiService/SignUpForm")}
        remoteName="User UI Service"
        remoteProps={{
          onSignUpSuccess: (user: User) => {
            setUser(user);
            navigate("/otp");
          },
          onBackToLogin: () => navigate("/login"),
        }}
        loadingMessage="Loading sign-up form..."
        errorMessage="Sign-up service unavailable"
      />
    </AuthLayout>
  );
};

export default SignUpPage;
