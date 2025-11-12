import AuthLayout from "@components/auth/AuthLayout";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

const SetDisplayNamePage: React.FC = () => {
  return (
    <AuthLayout>
      <RemoteWrapper
        remote={() => import("userUiService/SetDisplayNameForm")}
        remoteName="User UI Service"
        loadingMessage="Loading display name form..."
        errorMessage="Display name service unavailable"
      />
    </AuthLayout>
  );
};

export default SetDisplayNamePage;
