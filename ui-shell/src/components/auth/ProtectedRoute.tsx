import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "userUiService/useAuth";

const ProtectedRoute: React.FC = () => {
  const { user, token } = useAuth();

  if (!user || !token) {
    // Not authenticated → bounce back to landing/login
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
