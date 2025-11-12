import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/data/UserStore";

const UnverifiedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.isVerified) {
    return <Navigate to="/matching" replace />;
  }

  return <Outlet />;
};

export default UnverifiedRoute;
