import React, { useEffect, useState } from "react";
import {
  MdLayers,
  MdDashboard,
  MdExpandMore,
  MdPerson,
  MdChevronLeft,
  MdChevronRight,
  MdEventAvailable,
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
      {
        label: "EMPLOYEE",
        children: [
          { label: "EMPLOYEES", href: "/employees/all" },
          { label: "SHIFTS",    href: "/shifts/all" },
        ],
      },
      {
        label: "ATTENDANCE",
        icon: MdEventAvailable,
        children: [
          { label: "CALENDAR",    href: "/attendance/calendar"     },
          { label: "PERMISSIONS", href: "/attendance/permissions"  },
          { label: "OVERTIME",    href: "/attendance/overtime"     },
        ],
      },
    ],
  },
  {
    label: "APOLLO",
    icon: MdDashboard,
  },
];

// Build initial open/closed state
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
  const [isPinned,      setIsPinned]      = useState(false);
  const [isHovering,    setIsHovering]    = useState(false);
  const [isMobileOpen,  setIsMobileOpen]  = useState(false);
  const [openMenus,     setOpenMenus]     = useState(() => buildInitialOpenMenus(MENU_ITEMS));

  const isExpanded = isPinned || isHovering;

  const setMobileOpen = (next) => {
    setIsMobileOpen(next);
    window.dispatchEvent(
      new CustomEvent("sidebar:statechange", { detail: { open: next } })
    );
  };

  // Auto-open active route parents
  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname;
    const findAndOpen = (items, parentKey = "") => {
      for (const item of items) {
        const key = parentKey ? `${parentKey}/${item.label}` : item.label;
        if (item.href === currentPath) return true;
        if (item.children) {
          if (findAndOpen(item.children, key)) {
            setOpenMenus((prev) => ({ ...prev, [key]: true }));
            return true;
          }
        }
      }
      return false;
    };
    findAndOpen(MENU_ITEMS);
  }, []);

  // Persist pin state
  useEffect(() => {
    const stored = localStorage.getItem("sidebarPinned");
    if (stored === "true") setIsPinned(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarPinned", isPinned ? "true" : "false");
  }, [isPinned]);

  // Active link highlight
  useEffect(() => {
    const currentPath = window.location.pathname;
    document.querySelectorAll(".sidebar-menu a.menu-link").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("href") === currentPath);
    });
  }, []);

  // Collapse all menus when sidebar collapses
  useEffect(() => {
    if (!isExpanded) {
      setOpenMenus((prev) => {
        const closed = {};
        Object.keys(prev).forEach((k) => (closed[k] = false));
        return closed;
      });
    }
  }, [isExpanded]);

  // Sync width CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-current-width",
      isExpanded ? "240px" : "70px"
    );
  }, [isExpanded]);

  // Mobile toggle listener
  useEffect(() => {
    const handleToggle = () => setMobileOpen(!isMobileOpen);
    window.addEventListener("sidebar:toggle", handleToggle);
    return () => window.removeEventListener("sidebar:toggle", handleToggle);
  }, [isMobileOpen]);

  // ESC closes mobile
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleEsc = (e) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isMobileOpen]);

  // Prevent body scroll when mobile open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  const handleMouseEnter = () => { if (!isPinned) setIsHovering(true);  };
  const handleMouseLeave = () => { if (!isPinned) setIsHovering(false); };
  const handlePinToggle  = () => setIsPinned((prev) => !prev);
  const toggleMenu       = (key) => setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderMenuItems = (items, parentKey = "", depth = 0) =>
    items.map((item) => {
      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      const key         = parentKey ? `${parentKey}/${item.label}` : item.label;
      const isOpen      = !!openMenus[key];
      const isTopLevel  = depth === 0;
      const Icon        = item.icon;

      return (
        <li
          key={key}
          className={"menu-item" + (isOpen ? " menu-item--open" : "")}
          style={depth > 1 ? { paddingLeft: `${(depth - 1) * 10}px` } : undefined}
        >
          <a
            href={hasChildren ? undefined : item.href}
            className="menu-link"
            onClick={(e) => {
              if (hasChildren) { e.preventDefault(); toggleMenu(key); }
              if (!hasChildren) setMobileOpen(false);
            }}
          >
            {isTopLevel && Icon && <Icon className="menu-icon" />}
            <span className="menu-text">{item.label}</span>
            {hasChildren && <MdExpandMore className="menu-arrow" />}
          </a>

          {hasChildren && (
            <ul className={"sub-menu " + (isExpanded && isOpen ? "sub-menu--open" : "")}>
              {renderMenuItems(item.children, key, depth + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[39] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "app-menu app-menu--mobile",
          isExpanded    ? "app-menu--expanded"    : "app-menu--collapsed",
          isPinned      ? "app-menu--pinned"       : "",
          isMobileOpen  ? "app-menu--mobile-open"  : "",
        ].join(" ")}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo */}
        <div className="logo-box">
          <a href="/admin-dashboard" className="logo">
            <span className="logo-icon-circle"><MdPerson /></span>
            <span className="logo-text">Admin <br /> Dashboard</span>
          </a>
          {isExpanded && (
            <button onClick={handlePinToggle} className="sidebar-pin-btn">
              {isPinned ? <MdChevronLeft /> : <MdChevronRight />}
            </button>
          )}
        </div>

        {/* Menu */}
        <div className="scrollbar">
          <ul className="menu sidebar-menu">
            {renderMenuItems(MENU_ITEMS)}
          </ul>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;