import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { FaRegEye } from "react-icons/fa";
import { RiEyeCloseLine } from "react-icons/ri";
import LoginPage from "../assets/images/LoginPage.avif";
import LoginFormBG from "../assets/images/LoginFormBG.jpg";
import ForgotPassword from "../pages/Admin/Forgotpassword"; // ← new import

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [showForgot, setShowForgot] = useState(false); // ← new state
  const navigate = useNavigate();

  // ---------- AUTO REDIRECT IF ALREADY LOGGED IN ----------
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/api/admin/check_auth/");
        if (response.status === 200) {
          navigate("/admin-dashboard");
        }
      } catch (err) {
        console.log("User not authenticated or not admin");
      }
    };
    checkAuth();
  }, [navigate]);

  // ---------- VALIDATION ----------
  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- SUBMIT ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setError("");
    try {
      const response = await api.post("/api/admin/login/", {
        email: email.trim().toLowerCase(),
        password,
      });
      if (response.status === 200) {
        const { csrf: csrfToken } = response.data;
        api.defaults.headers.post["X-CSRFToken"] = csrfToken;
        navigate("/admin-dashboard");
      }
    } catch (err) {
      if (err.response) {
        setError(
          err.response.data.detail ||
            err.response.data.error ||
            "Invalid credentials",
        );
      } else {
        setError("Server error. Try again later.");
      }
    }
  };

  return (
    <div className="login-container">
      <div
        className="login-bg"
        style={{ backgroundImage: `url(${LoginFormBG})` }}
      />

      {/* Background shapes */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <div className="login-card">
        <div className="login-left">
          <img src={LoginPage} alt="Login Visual" className="bg-image" />
          <div className="overlay"></div>
        </div>

        <div className="login-right">
          <div className="brand-logo">
            <span className="brand-text">
              <span className="jrm">JRM</span> /{" "}
              <span className="apollo">APOLLO</span>
            </span>
          </div>

          <div className="header-text">
            <h4>
              Welcome to <span>Admin Login</span>
            </h4>
            <p>Sign in to continue to Dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* EMAIL */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                placeholder="Enter email"
                className="form-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: "" }));
                }}
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>

            {/* PASSWORD */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="form-input"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <RiEyeCloseLine /> : <FaRegEye />}
                </button>
              </div>
              {errors.password && (
                <p className="error-message">{errors.password}</p>
              )}
            </div>

            {/* ── FORGOT PASSWORD LINK ──────────────────────── */}
            <div style={{ textAlign: "right", marginTop: -8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#4f46e5",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Forgot Password?
              </button>
            </div>

            {/* SERVER ERROR */}
            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="btn-submit">
              Log In
            </button>
          </form>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ─────────────────────────── */}
      {showForgot && <ForgotPassword onClose={() => setShowForgot(false)} />}
    </div>
  );
}

export default Login;