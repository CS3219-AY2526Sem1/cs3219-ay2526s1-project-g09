import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/data/UserStore";

const ProtectedRoute: React.FC = () => {
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

  return <Outlet />;
};

export default ProtectedRoute;
