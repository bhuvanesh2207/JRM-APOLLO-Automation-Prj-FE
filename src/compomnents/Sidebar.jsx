import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
import { useAuth } from "../context/AuthContext";

const ADMIN_MENU = [
  {
    label: "JRM INFOTECH",
    icon: MdLayers,
    children: [
      { label: "CLIENT", href: "/client/all" },
      { label: "DOMAIN TRACKER", href: "/domain/all" },
      {
        label: "EMPLOYEE",
        children: [
          { label: "EMPLOYEES", href: "/employees/all" },
          { label: "SHIFTS", href: "/shifts/all" },
        ],
      },
      {
        label: "ATTENDANCE",
        icon: MdEventAvailable,
        children: [
          { label: "CALENDAR", href: "/attendance/calendar" },
          { label: "EMP PERMISSIONS", href: "/attendance/permissions" },
          { label: "EMP LEAVES", href: "/attendance/leaves" },
          { label: "EMP OVERTIME", href: "/attendance/overtime" },
          { label: "ASSIGN OT", href: "/attendance/ot-requests/assign" },
        ],
      },
      {
        label: "SALARY",
        children: [
          { label: "GENERATE SALARY", href: "/salary/generate" },
          { label: "SALARY LIST", href: "/salary/list" },
        ],
      },
    ],
  },
  {
    label: "APOLLO",
    icon: MdDashboard,
  },
];

const EMPLOYEE_MENU = [
  {
    label: "MY DASHBOARD",
    icon: MdDashboard,
    children: [
      { label: "My Profile", href: "/employee/profile" },
      { label: "My Attendance", href: "/employee/attendance" },
      { label: "My Overtime", href: "/employee/overtime" },
      { label: "Apply Permissions", href: "/employee/permissions" },
      { label: "Apply Leave", href: "/employee/leaveForm" },
      { label: "Apply OverTime", href: "/employee/overtime/request" },
    ],
  },
];

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
  const [isPinned, setIsPinned] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { role } = useAuth();
  const location = useLocation();
  const menuItems = role === "employee" ? EMPLOYEE_MENU : ADMIN_MENU;

  const [openMenus, setOpenMenus] = useState(() =>
    buildInitialOpenMenus(menuItems),
  );

  const isExpanded = isPinned || isHovering;

  // Reset open menus when role/menu changes
  useEffect(() => {
    setOpenMenus(buildInitialOpenMenus(menuItems));
  }, [menuItems]);

  const setMobileOpenState = (next) => {
    setIsMobileOpen(next);
    window.dispatchEvent(
      new CustomEvent("sidebar:statechange", { detail: { open: next } }),
    );
  };

  // Auto open active path
  useEffect(() => {
    const currentPath = location.pathname;

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

    findAndOpen(menuItems);
  }, [location.pathname, menuItems]);

  // Persist pin
  useEffect(() => {
    const stored = localStorage.getItem("sidebarPinned");
    if (stored === "true") setIsPinned(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarPinned", isPinned ? "true" : "false");
  }, [isPinned]);

  // Active link highlight
  useEffect(() => {
    const currentPath = location.pathname;
    document.querySelectorAll(".sidebar-menu a.menu-link").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("href") === currentPath);
    });
  }, [location.pathname]);

  // Collapse submenus when sidebar collapses
  useEffect(() => {
    if (!isExpanded) {
      setOpenMenus((prev) => {
        const closed = {};
        Object.keys(prev).forEach((k) => (closed[k] = false));
        return closed;
      });
    }
  }, [isExpanded]);

  // Sync CSS variable for layout width
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-current-width",
      isExpanded ? "240px" : "70px",
    );
  }, [isExpanded]);

  // Mobile toggle listener
  useEffect(() => {
    const handleToggle = () => setMobileOpenState(!isMobileOpen);
    window.addEventListener("sidebar:toggle", handleToggle);
    return () => window.removeEventListener("sidebar:toggle", handleToggle);
  }, [isMobileOpen]);

  // ESC to close on mobile
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") setMobileOpenState(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isMobileOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handleMouseEnter = () => {
    if (!isPinned) setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (!isPinned) setIsHovering(false);
  };

  const handlePinToggle = () => setIsPinned((prev) => !prev);

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderMenuItems = (items, parentKey = "", depth = 0) =>
    items.map((item) => {
      const hasChildren =
        Array.isArray(item.children) && item.children.length > 0;

      const key = parentKey ? `${parentKey}/${item.label}` : item.label;

      const isOpen = !!openMenus[key];
      const isTopLevel = depth === 0;
      const Icon = item.icon;

      return (
        <li
          key={key}
          className={"menu-item" + (isOpen ? " menu-item--open" : "")}
          style={
            depth > 1 ? { paddingLeft: `${(depth - 1) * 10}px` } : undefined
          }
        >
          {hasChildren ? (
            <button
              type="button"
              className="menu-link"
              onClick={(e) => {
                e.preventDefault();
                toggleMenu(key);
              }}
            >
              {isTopLevel && Icon && <Icon className="menu-icon" />}
              <span className="menu-text">{item.label}</span>
              <MdExpandMore className="menu-arrow" />
            </button>
          ) : (
            <Link
              to={item.href}
              className="menu-link"
              onClick={() => setMobileOpenState(false)}
            >
              {isTopLevel && Icon && <Icon className="menu-icon" />}
              <span className="menu-text">{item.label}</span>
            </Link>
          )}

          {hasChildren && (
            <ul
              className={
                "sub-menu " + (isExpanded && isOpen ? "sub-menu--open" : "")
              }
            >
              {renderMenuItems(item.children, key, depth + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[39] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpenState(false)}
        />
      )}

      <aside
        className={[
          "app-menu app-menu--mobile",
          isExpanded ? "app-menu--expanded" : "app-menu--collapsed",
          isPinned ? "app-menu--pinned" : "",
          isMobileOpen ? "app-menu--mobile-open" : "",
        ].join(" ")}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="logo-box">
          <Link
            to={
              role === "employee" ? "/employee/dashboard" : "/admin/dashboard"
            }
            className="logo"
          >
            <span className="logo-icon-circle">
              <MdPerson />
            </span>
            <span className="logo-text">
              {role === "employee" ? "Employee" : "Admin"} <br /> Dashboard
            </span>
          </Link>

          {isExpanded && (
            <button onClick={handlePinToggle} className="sidebar-pin-btn">
              {isPinned ? <MdChevronLeft /> : <MdChevronRight />}
            </button>
          )}
        </div>

        <div className="scrollbar">
          <ul className="menu sidebar-menu">{renderMenuItems(menuItems)}</ul>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
