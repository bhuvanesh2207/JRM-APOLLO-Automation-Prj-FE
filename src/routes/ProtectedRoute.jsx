import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { loading, isAuthenticated, role, force_password_change } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated)
    return <Navigate to="/" replace state={{ from: location }} />;

  if (force_password_change && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const target =
      role === "employee" ? "/employee/dashboard" : "/admin/dashboard";
    return <Navigate to={target} replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
