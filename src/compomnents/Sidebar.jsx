// Sidebar.jsx
import React, { useEffect, useState } from "react";
import {
  MdLayers,
  MdDashboard,
  MdExpandMore,
  MdPerson,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";
import "../assets/css/index.css";

const MENU_ITEMS = [
  {
    label: "JRM INFOTECH",
    icon: MdLayers,
    children: [
      {
        label: "CLIENT",
        href: "/client/all",
      },
      {
        label: "DOMAIN TRACKER",
        href: "/domain/all",
      },
    ],
  },
  {
    label: "APOLLO",
    icon: MdDashboard,
  },
];

// Build initial open/closed state for all items that have children
const buildInitialOpenMenus = (items, parentKey = "") => {
  const state = {};
  items.forEach((item) => {
    const key = parentKey ? `${parentKey}/${item.label}` : item.label;
    if (item.children && item.children.length) {
      state[key] = false;
      Object.assign(state, buildInitialOpenMenus(item.children, key));
    }
  });
  return state;
};

function Sidebar() {
  const [isPinned, setIsPinned]       = useState(false);
  const [isHovering, setIsHovering]   = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [openMenus, setOpenMenus] = useState(() =>
    buildInitialOpenMenus(MENU_ITEMS),
  );

  const isExpanded = isPinned || isHovering;

  // ── Helper: update mobile-open state AND notify Navbar ──────────────
  const setMobileOpen = (next) => {
    setIsMobileOpen(next);
    // Broadcast the real state so Navbar's hamburger icon stays in sync
    window.dispatchEvent(
      new CustomEvent("sidebar:statechange", { detail: { open: next } })
    );
  };

  // ── Persist pin preference ───────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("sidebarPinned");
    if (stored === "true") setIsPinned(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("sidebarPinned", isPinned ? "true" : "false");
  }, [isPinned]);

  // ── Mark active link ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname;
    document.querySelectorAll(".sidebar-menu a.menu-link").forEach((el) => {
      if (el.getAttribute("href") === currentPath) {
        el.classList.add("active");
      }
    });
  }, []);

  // ── Close all sub-menus when sidebar collapses ───────────────────────
  useEffect(() => {
    if (!isExpanded) {
      setOpenMenus((prev) => {
        const closed = {};
        Object.keys(prev).forEach((k) => (closed[k] = false));
        return closed;
      });
    }
  }, [isExpanded]);

  // ── Keep CSS variable in sync with expanded state ────────────────────
  useEffect(() => {
    const width = isExpanded ? "240px" : "70px";
    document.documentElement.style.setProperty("--sidebar-current-width", width);
  }, [isExpanded]);

  // ── Mobile drawer: toggle on hamburger click ─────────────────────────
  useEffect(() => {
    const handleToggle = () => {
      setMobileOpen(!isMobileOpen);
    };
    window.addEventListener("sidebar:toggle", handleToggle);
    return () => window.removeEventListener("sidebar:toggle", handleToggle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileOpen]);

  // ── ESC key closes mobile drawer ─────────────────────────────────────
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileOpen]);

  // ── Prevent body scroll when drawer is open on mobile ───────────────
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  const handleMouseEnter = () => { if (!isPinned) setIsHovering(true); };
  const handleMouseLeave = () => { if (!isPinned) setIsHovering(false); };
  const handlePinToggle  = () => setIsPinned((prev) => !prev);

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderMenuItems = (items, parentKey = "") =>
    items.map((item) => {
      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      const key         = parentKey ? `${parentKey}/${item.label}` : item.label;
      const isOpen      = !!openMenus[key];
      const isTopLevel  = !parentKey;
      const Icon        = item.icon;

      return (
        <li key={key} className={"menu-item" + (isOpen ? " menu-item--open" : "")}>
          <a
            href={hasChildren ? undefined : item.href}
            className="menu-link"
            onClick={(e) => {
              if (hasChildren) {
                e.preventDefault();
                toggleMenu(key);
              }
              // Close mobile drawer on navigation
              if (!hasChildren) setMobileOpen(false);
            }}
          >
            {isTopLevel && Icon && <Icon className="menu-icon" />}
            <span className="menu-text">{item.label}</span>
            {hasChildren && <MdExpandMore className="menu-arrow" />}
          </a>

          {hasChildren && (
            <ul className={"sub-menu " + (isExpanded && isOpen ? "sub-menu--open" : "")}>
              {renderMenuItems(item.children, key)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <>
      {/* ── Mobile overlay ── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[39] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        id="app-sidebar"
        role="navigation"
        aria-label="Main navigation"
        aria-expanded={isMobileOpen.toString()}
        className={[
          "app-menu app-menu--mobile",
          isExpanded ? "app-menu--expanded" : "app-menu--collapsed",
          isPinned    ? "app-menu--pinned"   : "",
          isMobileOpen ? "app-menu--mobile-open" : "",
        ].join(" ")}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── Logo bar ── */}
        <div className="logo-box">
          <a href="/admin-dashboard" className="logo">
            <span className="logo-icon-circle">
              <MdPerson className="logo-icon-person" />
            </span>
            <span className="logo-text">
              Admin <br />
              Dashboard
            </span>
          </a>

          {/* Pin / unpin button — only shown when expanded on desktop */}
          {isExpanded && (
            <button
              type="button"
              onClick={handlePinToggle}
              className={"sidebar-pin-btn" + (isPinned ? " sidebar-pin-btn--active" : "")}
              aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              {isPinned ? (
                <MdChevronLeft className="sidebar-pin-icon" />
              ) : (
                <MdChevronRight className="sidebar-pin-icon" />
              )}
            </button>
          )}
        </div>

        {/* ── Scrollable menu area ── */}
        <div className="scrollbar">
          <ul className="menu sidebar-menu">{renderMenuItems(MENU_ITEMS)}</ul>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;