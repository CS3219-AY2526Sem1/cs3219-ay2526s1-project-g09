import { useEffect } from "react";
import AuthLayout from "@components/auth/AuthLayout";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";
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
      <RemoteWrapper
        remote={() => import("userUiService/OtpForm")}
        remoteName="User UI Service"
        remoteProps={{
          user,
          onOTPSuccess: handleOTPSuccess,
        }}
        loadingMessage="Loading OTP form..."
        errorMessage="OTP service unavailable"
      />
    </AuthLayout>
  );
};

export default OtpPage;
