import { Card } from "@/components/ui/card";
import UserProfileSection from "./UserProfileSection";
import AccountSecuritySection from "./AccountSecuritySection";
import AccountDeletionSection from "./AccountDeletionSection";

const UserProfileCard = () => {
  return (
    <Card className="bg-gray-800 text-gray-200 border border-gray-700 w-[60vw]">
      <UserProfileSection />
      <AccountSecuritySection />
      <AccountDeletionSection />
    </Card>
  );
};

export default UserProfileCard;
