import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import UserProfileCard from "userUiService/UserProfileCard";
import { useAuth } from "@/data/UserStore";
import type { User } from "@/types/User";

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  return (
    <Layout navHeader={<NavHeader />}>
      <div className="flex justify-center items-center pt-20">
        <UserProfileCard
          user={user}
          onUserUpdated={(updatedUser: User) => setUser(updatedUser)}
          onAccountDeleted={() => {
            setUser(null);
            navigate("/");
          }}
        />
      </div>
    </Layout>
  );
};

export default UserProfile;
