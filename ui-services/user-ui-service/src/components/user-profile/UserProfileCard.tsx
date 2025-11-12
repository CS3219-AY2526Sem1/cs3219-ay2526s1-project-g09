import { Card } from "@/components/ui/card";
import UserProfileSection from "./UserProfileSection";
import AccountSecuritySection from "./AccountSecuritySection";
import AccountDeletionSection from "./AccountDeletionSection";
import type { User } from "@/types/User";

interface UserProfileCardProps {
  user: User;
  onAccountDeleted?: () => void;
  onUserUpdated?: (user: User) => void;
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
