import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/data/UserStore";

interface AdminRouteProps {
  navHeader?: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ navHeader }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    console.log("Not logged in");
    return <Navigate to="/login" replace />;
  }

  if (!user.isAdmin) {
    console.log("Not authorized");
    return <Navigate to="/matching" replace />;
  }

  return <Outlet context={{ navHeader }} />;
};

export default AdminRoute;
