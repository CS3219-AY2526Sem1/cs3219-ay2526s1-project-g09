import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { AuthService } from "../../api/AuthService";

const ProtectedRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    AuthService.verifyToken(token)
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
