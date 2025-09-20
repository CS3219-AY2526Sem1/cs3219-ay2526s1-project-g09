import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AccountSecuritySection = () => {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Account Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col w-[300px]">
            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <Input
              id="email"
              type="email"
              defaultValue="CurrentEmail@gmail.com"
              className="bg-gray-900 border-gray-700 text-gray-200"
            />
          </div>
          <div className="w-[150px]">
            <Button
              variant="outline"
              className="w-full bg-gray-900 text-gray-200 hover:bg-gray-700 border-gray-700"
            >
              Change email
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col w-[300px]">
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <Input
              id="password"
              type="password"
              defaultValue="• • • • • • • •"
              className="bg-gray-900 border-gray-700 text-gray-200"
            />
          </div>
          <div className="w-[150px]">
            <Button
              variant="outline"
              className="w-full bg-gray-900 text-gray-200 hover:bg-gray-700 border-gray-700"
            >
              Change password
            </Button>
          </div>
        </div>
      </CardContent>
    </>
  );
};

export default AccountSecuritySection;