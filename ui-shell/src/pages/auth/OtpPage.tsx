import { useEffect } from "react";
import AuthLayout from "@components/auth/AuthLayout";
import OtpForm from "userUiService/OtpForm";
import type { User } from "@/types/User";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/data/UserStore";

const OtpPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const handleOTPSuccess = async (verifiedUser: User) => {
    console.log("OTP verified, logging user in.");
    setUser(verifiedUser);
    navigate("/matching");
  };

  return (
    <AuthLayout>
      <OtpForm
        user={user}
        onOTPSuccess={(verifiedUser: User) => handleOTPSuccess(verifiedUser)}
      />
    </AuthLayout>
  );
};

export default OtpPage;
