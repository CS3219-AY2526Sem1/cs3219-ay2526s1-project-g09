import Layout from "@/components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import UserProfileCard from "userUiService/UserProfileCard";

const UserProfile = () => {
  return (
    <Layout navHeader={<NavHeader />}>
      <div className="flex justify-center items-center pt-20">
        <UserProfileCard />
      </div>
    </Layout>
  );
};

export default UserProfile;
