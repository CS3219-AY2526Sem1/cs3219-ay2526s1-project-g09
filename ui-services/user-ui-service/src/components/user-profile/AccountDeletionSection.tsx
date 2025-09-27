import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AccountDeletionSection = () => {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Support Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 flex gap-4 justify-between items-center">
        <div>
          <CardTitle className="text-lg text-red-500 font-semibold">
            Delete my account
          </CardTitle>
          <CardDescription className="text-red-400">
            Permanently delete the account and remove access from all workspaces
          </CardDescription>
        </div>
        <div className="w-[150px]">
          <Button
            variant="destructive"
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Delete account
          </Button>
        </div>
      </CardContent>
    </>
  );
};

export default AccountDeletionSection;
