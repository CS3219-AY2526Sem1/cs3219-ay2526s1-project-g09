import AuthLayout from "@components/auth/AuthLayout";
import OtpForm from "userUiService/OtpForm";
import type { User } from "userUiService/api/UserService";
import { useNavigate, useLocation } from "react-router-dom";

const OtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = (location.state as { user: User }).user;
  // TODO: pass token and user info to matching page
  return (
    <AuthLayout>
      <OtpForm user={user} onOTPSuccess={() => navigate("/matching")} />
    </AuthLayout>
  );
};

export default OtpPage;
