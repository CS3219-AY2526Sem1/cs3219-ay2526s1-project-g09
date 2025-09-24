import AuthLayout from "@components/auth/AuthLayout";
import OtpForm from "userUiService/OtpForm";

const OtpPage: React.FC = () => {
  return (
    <AuthLayout>
      <OtpForm />
    </AuthLayout>
  );
};

export default OtpPage;
