import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import UserProfileCard from "userUiService/UserProfileCard";

const UserProfile = () => {
  const navigate = useNavigate();
  return (
    <Layout navHeader={<NavHeader />}>
      <div className="flex justify-center items-center pt-20">
        <UserProfileCard onAccountDeleted={() => navigate("/")} />
      </div>
    </Layout>
  );
};

export default UserProfile;
