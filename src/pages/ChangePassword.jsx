import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function ChangePassword() {
  const { role, logout, setAuth, force_password_change } = useAuth();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const endpoint = "/api/admin/change-password/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // ✅ Only validate current password if NOT a temp password login
    if (!force_password_change && !current) {
      setError("Please enter your current password.");
      return;
    }
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post(endpoint, {
        // ✅ Only send current_password if it's not a temp password flow
        ...(!force_password_change && { current_password: current }),
        new_password: password,
        confirm_password: confirm,
      });

      setSuccess("Password updated successfully.");
      setAuth({ force_password_change: false });

      setTimeout(() => {
        navigate(
          role === "employee" ? "/employee/dashboard" : "/admin/dashboard",
        );
      }, 800);

    } catch (err) {
      if (err.response?.status === 401) {
        await logout();
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Unable to update password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <div className="auth-card">
        <h2>Change Password</h2>
        <p>
          {force_password_change
            ? "Please set a new password before continuing."
            : "Enter your current password to set a new one."}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* ✅ Only show current password field when NOT a temp password login */}
          {!force_password_change && (
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus={force_password_change}
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Saving…" : "Save Password"}
          </button>
        </form>
      </div>
    </div>
  );
}