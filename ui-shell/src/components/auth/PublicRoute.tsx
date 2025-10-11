import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/data/UserStore";

const PublicRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (user && user.isVerified) {
    return <Navigate to="/matching" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
