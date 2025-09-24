import AuthLayout from "@components/auth/AuthLayout";
import SignUpForm from "userUiService/SignUpForm";
const SignUpPage: React.FC = () => {
  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
};

export default SignUpPage;
