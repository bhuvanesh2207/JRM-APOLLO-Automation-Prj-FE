import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
// import "../assets/css/login.css";
import { FaRegEye } from "react-icons/fa";
import { RiEyeCloseLine } from "react-icons/ri";
import LoginPage from "../assets/images/LoginPage.avif";
import LoginFormBG from "../assets/images/LoginFormBG.jpg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/api/admin/login/", {
        email,
        password,
      });

      if (response.data.success) {
        navigate("/admin-dashboard");
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.error || "Invalid credentials");
      } else {
        setError("Server error. Try again later.");
      }
    }
  };

  return (
    <div className="login-container">
      <div
        className="login-bg"
        style={{
          backgroundImage: `url(${LoginFormBG})`,
        }}
      ></div>
      {/* Background animated shapes */}
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
            <span className="brand-text">JRM / APOLLO</span>
          </div>

          <div className="header-text">
            <h4>
              Welcome to <span>Admin Login</span>
            </h4>
            <p>Sign in to continue to Dashboard.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaRegEye /> : <RiEyeCloseLine />}
                </button>
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="btn-submit">
              Log In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
export default Login;
