import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const UserProfileSection = () => {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">User Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col w-[300px]">
            <label htmlFor="displayName" className="text-sm font-semibold">
              Display Name
            </label>
            <Input
              id="displayName"
              defaultValue="Current Username"
              className="bg-gray-900 border-gray-700 text-gray-200"
            />
          </div>
          <div className="w-[150px]">
            <Button
              variant="outline"
              className="w-full bg-gray-900 text-gray-200 hover:bg-gray-700 border-gray-700"
            >
              Change display name
            </Button>
          </div>
        </div>
      </CardContent>
    </>
  );
};

export default UserProfileSection;
