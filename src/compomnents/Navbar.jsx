import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import avatar from "../assets/images/avatar.png";

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(name + "="))
    ?.split("=")[1];
}

async function logoutUser() {
  try {
    await fetch("/api/admin/logout/", {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
    });
  } catch (err) {
    console.error("Logout failed:", err);
  }
}

const SEARCH_ITEMS = [
  {
    label: "Domains",
    description: "View all domains",
    path: "/domain/all",
    type: "Domain",
  },
  {
    label: "Clients",
    description: "View all clients",
    path: "/client/all",
    type: "Client",
  },
  {
    label: "Employees",
    description: "View all employees",
    path: "/employees/all",
    type: "Employee",
  },
  {
    label: "Calendar",
    description: "View calendar",
    path: "/attendance/calendar",
    type: "Calendar",
  },
];

const Navbar = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [hamOpen, setHamOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const filteredItems = query.trim()
    ? SEARCH_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.type.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setSearchOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    const h = (e) => setHamOpen(e.detail.open);
    window.addEventListener("sidebar:statechange", h);
    return () => window.removeEventListener("sidebar:statechange", h);
  }, []);

  const toggleSidebar = () => window.dispatchEvent(new Event("sidebar:toggle"));

  const handleLogout = async () => {
    setProfileOpen(false);
    await logoutUser();
    navigate("/");
  };

  const handleResultClick = (path) => {
    setSearchOpen(false);
    setQuery("");
    navigate(path);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setSearchOpen(true);
  };

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
        <div className="topbar-search" role="search" ref={searchRef}>
          <span className="topbar-search-icon" aria-hidden="true">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            className="topbar-search-input"
            placeholder="Search domains, clients…"
            aria-label="Search"
            value={query}
            onChange={handleInputChange}
            autoComplete="off"
          />

          {/* ── Dropdown ── */}
          {searchOpen && query.trim() && (
            <div className="search-dropdown" role="listbox">
              {filteredItems.length === 0 ? (
                <div className="search-dropdown-empty">
                  No results for "{query}"
                </div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    className="search-dropdown-item"
                    onClick={() => handleResultClick(item.path)}
                  >
                    <span className="search-item-badge">{item.type}</span>
                    <span className="search-item-desc">{item.description}</span>
                  </button>
                ))
              )}
            </div>
          )}
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

            <div
              className={`profile-dropdown${profileOpen ? " profile-dropdown--open" : ""}`}
              role="menu"
              aria-label="User menu"
            >
              <div className="profile-dropdown-header">My Account</div>
              <button
                type="button"
                className="profile-dropdown-item"
                role="menuitem"
                onClick={handleLogout}
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
