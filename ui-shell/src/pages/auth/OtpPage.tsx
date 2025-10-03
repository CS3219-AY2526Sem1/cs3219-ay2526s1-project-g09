import { useEffect } from "react";
import AuthLayout from "@components/auth/AuthLayout";
import OtpForm from "userUiService/OtpForm";
import type { User } from "@peerprep/types";
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

  if (!user) {
    return null;
  }

  return (
    <AuthLayout>
      <OtpForm
        user={user}
        onOTPSuccess={(verifiedUser: User) => {
          setUser(verifiedUser);

          navigate("/matching");
        }}
      />
    </AuthLayout>
  );
};

export default OtpPage;
