import { useEffect } from "react";
import AuthLayout from "@components/auth/AuthLayout";
import OtpForm from "userUiService/OtpForm";
import type { User } from "../../api/AuthService";
import { useNavigate, useLocation } from "react-router-dom";

const OtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = (location.state as { user?: User })?.user;

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <AuthLayout>
      <OtpForm user={user} onOTPSuccess={() => navigate("/matching")} />
    </AuthLayout>
  );
};

export default OtpPage;
