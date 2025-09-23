import AuthLayout from "@components/auth/AuthLayout";
import SignUpForm from "userUiService/SignUpForm";
import { useNavigate } from "react-router-dom";
const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <SignUpForm onSignUpSuccess={() => navigate("/matching")} />
    </AuthLayout>
  );
};

export default SignUpPage;
