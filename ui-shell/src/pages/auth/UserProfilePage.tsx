import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import UserProfileCard from "userUiService/UserProfileCard";
import { useAuth } from "@/data/UserStore";

const UserProfile = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  return (
    <Layout navHeader={<NavHeader />}>
      <div className="flex justify-center items-center pt-20">
        <UserProfileCard
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
