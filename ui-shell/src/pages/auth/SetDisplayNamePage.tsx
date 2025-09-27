import AuthLayout from "@components/auth/AuthLayout";
import SetDisplayNameForm from "userUiService/SetDisplayNameForm";

const SetDisplayNamePage: React.FC = () => {
  return (
    <AuthLayout>
      <SetDisplayNameForm />
    </AuthLayout>
  );
};

export default SetDisplayNamePage;
