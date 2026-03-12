import React, { useEffect, useRef, useState } from "react";
import { FaSearch, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../assets/css/index.css";
import Admin from "../assets/images/Admin.avif";

function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // Detect mobile view
  const isMobile = () => window.innerWidth <= 768;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    const handleResize = () => {
      if (!isMobile()) setIsProfileOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ✅ UPDATED logout handler
  const handleLogout = async () => {
    try {
      await api.post("/api/admin/logout/");

      // 🔥 Important: hard redirect clears memory & state
      window.location.replace("/");
    } catch (error) {
      console.error("❌ Logout failed", error);
      window.location.replace("/");
    }
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Left: Search */}
        <div className="topbar-left">
          <div className="topbar-search">
            <FaSearch className="topbar-search-icon" />
            <input
              type="search"
              className="topbar-search-input"
              placeholder="Search..."
            />
          </div>
        </div>

        {/* Right */}
        <div className="topbar-right">
          <div className="topbar-divider" />

          <div className="topbar-profile-wrapper" ref={profileRef}>
            {/* Avatar Image */}
            <img
              src={Admin}
              alt="user"
              className="topbar-profile-avatar"
              onClick={() => setIsProfileOpen((prev) => !prev)}
            />

            {/* Admin Button */}
            <button
              type="button"
              className="topbar-profile"
              onClick={() => setIsProfileOpen((prev) => !prev)}
            >
              <div className="topbar-profile-info">
                <span className="topbar-profile-name">Admin</span>
              </div>
            </button>

            {/* Dropdown */}
            <div
              className={
                "profile-dropdown" +
                (isProfileOpen ? " profile-dropdown--open" : "")
              }
            >
              <div className="profile-dropdown-header">Welcome!</div>

              <button
                type="button"
                className="profile-dropdown-item"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="profile-dropdown-item-icon" />
                <span className="profile-dropdown-item-label">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
