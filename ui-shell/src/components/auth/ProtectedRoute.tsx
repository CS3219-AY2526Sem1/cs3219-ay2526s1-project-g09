import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "userUiService/useAuth";

const ProtectedRoute: React.FC = () => {
  const { user } = useAuth();

  if (!user || !user.isVerified) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
