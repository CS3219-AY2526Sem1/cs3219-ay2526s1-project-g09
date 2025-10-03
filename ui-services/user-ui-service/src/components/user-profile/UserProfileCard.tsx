import { Card } from "@/components/ui/card";
import UserProfileSection from "./UserProfileSection";
import AccountSecuritySection from "./AccountSecuritySection";
import AccountDeletionSection from "./AccountDeletionSection";
import type { User } from "@peerprep/types";

interface UserProfileCardProps {
  user: User;
  onAccountDeleted?: () => void;
  onUserUpdated?: () => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  onAccountDeleted,
  onUserUpdated,
}) => {
  return (
    <Card className="bg-gray-800 text-gray-200 border border-gray-700 w-[60vw]">
      <UserProfileSection user={user} onUserUpdated={onUserUpdated} />
      <AccountSecuritySection user={user} onUserUpdated={onUserUpdated} />
      <AccountDeletionSection user={user} onAccountDeleted={onAccountDeleted} />
    </Card>
  );
};

export default UserProfileCard;
