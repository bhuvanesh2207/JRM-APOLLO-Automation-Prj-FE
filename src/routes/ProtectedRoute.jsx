import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axiosInstance from "../api/axios";

const ProtectedRoute = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        await axiosInstance.get("/api/admin/check_auth/");
        if (isMounted) setIsAuth(true);
      } catch {
        if (isMounted) setIsAuth(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isAuth === null) return <div>Loading...</div>;
  if (!isAuth) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
