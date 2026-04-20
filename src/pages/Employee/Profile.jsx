import React, { useState, useEffect } from "react";
import api from "../../api/axios";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get("/api/employees/profile/").then(res => { 
      setProfile(res.data);
    }).catch(() => setError("Failed to load profile."));
  }, []);

  const initials = profile?.full_name
    ?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  const joinDate = profile?.join_date
    ? new Date(profile.join_date).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "—";

  if (!profile) {
    return (
      <div className="pf-shell">
        <div className="pf-loader">
          <span className="pf-loader-dot" /><span className="pf-loader-dot" /><span className="pf-loader-dot" />
        </div>
      </div>
    );
  }

  return (
    <div className="pf-shell">
      <div className="pf-card">

        {/* ── Hero strip ── */}
        <div className="pf-hero">
          <div className="pf-hero-bg" />
          <div className="pf-hero-content">
            <div className="pf-avatar-wrap">
              <div className="pf-avatar">
                {profile.photo
                  ? <img src={profile.photo} alt={profile.full_name} />
                  : <span>{initials}</span>}
              </div>
            </div>

            <div className="pf-hero-info">
              <h1 className="pf-name">{profile.full_name}</h1>
              <div className="pf-meta">
                {profile.designation && <span className="pf-pill">{profile.designation}</span>}
                {profile.department  && <span className="pf-dept">{profile.department}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="pf-body">

          <div className="pf-section">
            <p className="pf-section-label">Account details</p>
            <div className="pf-grid">
              <div className="pf-field">
                <span className="pf-field-label">Employee ID</span>
                <span className="pf-field-value mono">{profile.employee_id}</span>
              </div>
              <div className="pf-field">
                <span className="pf-field-label">Email</span>
                <span className="pf-field-value">{profile.email}</span>
              </div>
              <div className="pf-field">
                <span className="pf-field-label">Joined</span>
                <span className="pf-field-value">{joinDate}</span>
              </div>
              <div className="pf-field">
                <span className="pf-field-label">Account no.</span>
                <span className="pf-field-value mono">{profile.account_no || "—"}</span>
              </div>
            </div>
          </div>

          <div className="pf-section">
            <p className="pf-section-label">Contact info</p>
            <div className="pf-grid">
              <div className="pf-field">
                <span className="pf-field-label">Phone</span>
                <span className="pf-field-value">{profile.phone || "—"}</span>
              </div>
              <div className="pf-field pf-field--full">
                <span className="pf-field-label">Address</span>
                <span className="pf-field-value">{profile.address || "—"}</span>
              </div>
            </div>
          </div>

          {error && <p className="pf-msg pf-msg--error">{error}</p>}
        </div>
      </div>
    </div>
  );
}