import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/data/UserStore";

interface ProtectedRouteProps {
  navHeader?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ navHeader }) => {
  const { user, loading, isLoggingOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!user && !isLoggingOut) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.isVerified) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet context={{ navHeader }} />;
};

export default ProtectedRoute;
