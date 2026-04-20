import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const AuthContext = createContext(null);

const initialState = {
  user: null,
  role: null,
  employee_id: null,
  force_password_change: false,
  jwt: null,
  isAuthenticated: false,
  loading: true,
};

const parseAuthPayload = (data, override = {}) => {
  const rawUser = data.user ?? data.employee ?? data;
  const user = rawUser.user ?? rawUser.employee ?? rawUser;
  const role =
    override.role ||
    data.role ||
    user.role ||
    (data.is_admin || user.is_admin || user.is_staff ? "admin" : "employee");
  const employee_id =
    override.employee_id ??
    data.employee_id ??
    user.employee_id ??
    data.employee?.employee_id ??
    null;
  const force_password_change =
    override.force_password_change ??
    data.force_password_change ??
    user.force_password_change ??
    false;
  const jwt = data.jwt ?? data.access ?? data.token ?? null;

  return {
    user,
    role,
    employee_id,
    force_password_change,
    jwt,
  };
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [state, setState] = useState(initialState);

  const clearAuth = useCallback(() => {
    setState({ ...initialState, loading: false });
  }, []);

  const setAuth = useCallback((payload) => {
    setState((prev) => ({
      ...prev,
      ...payload,
      isAuthenticated: true,
      loading: false,
    }));
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get("/api/admin/check_auth/");
      return parseAuthPayload(response.data);
    } catch (adminErr) {
      if (
        adminErr.response?.status === 403 ||
        adminErr.response?.status === 404
      ) {
        try {
          const response = await api.get("/api/employee/me/");
          return parseAuthPayload(response.data, { role: "employee" });
        } catch {
          throw adminErr;
        }
      }
      throw adminErr;
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const authPayload = await fetchCurrentUser();
      setAuth(authPayload);

      // ✅ On page refresh, redirect back to change-password if flag is still set
      if (authPayload.force_password_change) {
        navigate("/change-password");
      }
    } catch {
      clearAuth();
    }
  }, [fetchCurrentUser, setAuth, clearAuth, navigate]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async ({ email, password }) => {
    const response = await api.post("/api/admin/login/", {
      email,
      password,
    });

    if (response.data?.csrf) {
      api.defaults.headers.post["X-CSRFToken"] = response.data.csrf;
    }

    const authPayload = await fetchCurrentUser();
    setAuth(authPayload);

    // ✅ If temp password, send to change-password regardless of role
    if (authPayload.force_password_change) {
      navigate("/change-password");
      return authPayload;
    }

    // ✅ Normal role-based redirect after login
    if (authPayload.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/employee/dashboard");
    }

    return authPayload;
  };

  const logout = async () => {
    try {
      await api.post("/api/admin/logout/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
    clearAuth();
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        setAuth,
        clearAuth,
        loadUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};  