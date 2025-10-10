import AuthLayout from "@components/auth/AuthLayout";
import SignUpForm from "userUiService/SignUpForm";
import { useNavigate } from "react-router-dom";
import type { User } from "@/types/User";
import { useAuth } from "@/data/UserStore";
const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSignUp = async (user: User) => {
    setUser(user);
    navigate("/otp");
  };

  return (
    <AuthLayout>
      <SignUpForm onSignUpSuccess={(user: User) => handleSignUp(user)} />
    </AuthLayout>
  );
};

export default SignUpPage;
