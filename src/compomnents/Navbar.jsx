// Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import avatar from "../assets/images/avatar.png";

// ── helpers ──────────────────────────────────────────────────────────────────
function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(name + "="))
    ?.split("=")[1];
}

async function logoutUser() {
  try {
    await fetch("/api/admin/logout/", {   // relative — goes through Vite proxy
      method: "POST",
      credentials: "include",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
    });
  } catch (err) {
    console.error("Logout failed:", err);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const Navbar = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [hamOpen, setHamOpen]         = useState(false);
  const profileRef = useRef(null);
  const navigate   = useNavigate();

  /* close profile dropdown on outside click */
  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* Esc closes dropdown */
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") setProfileOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  /* sync hamburger state with Sidebar */
  useEffect(() => {
    const h = (e) => setHamOpen(e.detail.open);
    window.addEventListener("sidebar:statechange", h);
    return () => window.removeEventListener("sidebar:statechange", h);
  }, []);

  const toggleSidebar = () => {
    window.dispatchEvent(new Event("sidebar:toggle"));
  };

  // ── logout handler ──────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setProfileOpen(false);
    await logoutUser();   // blacklists refresh token + server deletes both cookies
    navigate("/");        // back to Login — the only public route in App.jsx
  };
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <header className="app-header" role="banner">
      <div className="app-header-inner">

        {/* ── Hamburger ── */}
        <button
          type="button"
          className={`hamburger-btn${hamOpen ? " is-open" : ""}`}
          aria-label={hamOpen ? "Close navigation" : "Open navigation"}
          aria-controls="app-sidebar"
          aria-expanded={hamOpen}
          onClick={toggleSidebar}
        >
          <span className="hamburger-line" aria-hidden="true" />
          <span className="hamburger-line" aria-hidden="true" />
          <span className="hamburger-line" aria-hidden="true" />
        </button>

        {/* ── Search ── */}
        <div className="topbar-search" role="search">
          <span className="topbar-search-icon" aria-hidden="true">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <input
            type="search"
            className="topbar-search-input"
            placeholder="Search…"
            aria-label="Site search"
          />
        </div>

        {/* ── Right side ── */}
        <div className="topbar-right">
          <div className="topbar-divider" aria-hidden="true" />

          {/* Profile */}
          <div className="topbar-profile-wrapper" ref={profileRef}>
            <img
              src={avatar}
              alt="User avatar"
              className="topbar-profile-avatar"
              onClick={() => setProfileOpen((v) => !v)}
              onKeyDown={(e) => e.key === "Enter" && setProfileOpen((v) => !v)}
              role="button"
              tabIndex={0}
            />
            <div className="topbar-profile-info">
              <span className="topbar-profile-name">Admin</span>
            </div>

            {/* Dropdown */}
            <div
              className={`profile-dropdown${profileOpen ? " profile-dropdown--open" : ""}`}
              role="menu"
              aria-label="User menu"
            >
              <div className="profile-dropdown-header">My Account</div>

              {/* ── Logout button ── */}
              <button
                type="button"
                className="profile-dropdown-item"
                role="menuitem"
                onClick={handleLogout}          // ← was: navigate("/logout")
              >
                <span className="profile-dropdown-item-label">Logout</span>
              </button>

            </div>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Navbar;