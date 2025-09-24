import AuthLayout from "@components/auth/AuthLayout";
import SignUpForm from "userUiService/SignUpForm";
import { useNavigate } from "react-router-dom";
import type { User } from "userUiService/api/UserService";
const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <SignUpForm
        onSignUpSuccess={(user: User) => navigate("/otp", { state: { user } })}
      />
    </AuthLayout>
  );
};

export default SignUpPage;
