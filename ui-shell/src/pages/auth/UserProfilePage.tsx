import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import { useAuth } from "@/data/UserStore";
import type { User } from "@/types/User";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  return (
    <Layout navHeader={<NavHeader />}>
      <div className="flex justify-center items-center pt-20">
        <RemoteWrapper
          remote={() => import("userUiService/UserProfileCard")}
          remoteProps={{
            user,
            onUserUpdated: (updatedUser: User) => setUser(updatedUser),
            onAccountDeleted: () => {
              setUser(null);
              navigate("/");
            },
          }}
          loadingMessage="Loading user profile..."
          errorMessage="User service unavailable"
        />
      </div>
    </Layout>
  );
};

export default UserProfile;
