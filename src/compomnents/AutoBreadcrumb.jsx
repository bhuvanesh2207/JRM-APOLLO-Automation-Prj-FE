// src/compomnents/AutoBreadcrumb.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, matchPath, Link } from "react-router-dom";

const breadcrumbMap = {
  "/domain/all": [
    { label: "Dashboard", path: "/admin-dashboard" },
    { label: "Domains" },
  ],
  "/domain/new": [
    { label: "Dashboard", path: "/admin-dashboard" },
    { label: "Domains", path: "/domain/all" },
    { label: "New Domain" },
  ],
  "/domain/update/:id": [
    { label: "Dashboard", path: "/admin-dashboard" },
    { label: "Domains", path: "/domain/all" },
    { label: "Edit Domain" },
  ],
  "/domain/history": [
    { label: "Dashboard", path: "/admin-dashboard" },
    { label: "Domains", path: "/domain/all" },
    { label: "Domain History" },
  ],
  "/domain/history/:domainId": [
    { label: "Dashboard", path: "/admin-dashboard" },
    { label: "Domains", path: "/domain/all" },
    { label: "Domain History" },
  ],
  "/client/all": [
    { label: "Dashboard", path: "/admin-dashboard" },
    { label: "Clients" },
  ],
  "/client/new": [
    { label: "Dashboard", path: "/admin-dashboard" },
    { label: "Clients", path: "/client/all" },
    { label: "New Client" },
  ],
  "/client/update/:id": [
    { label: "Dashboard", path: "/admin-dashboard" },
    { label: "Clients", path: "/client/all" },
    { label: "Edit Client" },
  ],
};

/* ── Breadcrumb renderer ── */
const Breadcrumb = ({ items }) => {
  const navRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  /* Collapse middle items when nav overflows on small screens */
  useEffect(() => {
    const check = () => {
      if (navRef.current) {
        setCollapsed(
          navRef.current.scrollWidth > navRef.current.clientWidth + 4,
        );
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [items]);

  /* When collapsed, show: first + "…" + last  (or all if expanded) */
  const visibleItems =
    collapsed && !expanded && items.length > 2
      ? [items[0], null, items[items.length - 1]] // null = ellipsis slot
      : items;

  return (
    <nav aria-label="breadcrumb" className="bc-nav" ref={navRef}>
      <ol className="bc-list">
        {visibleItems.map((item, index) => {
          /* Ellipsis slot */
          if (item === null) {
            return (
              <li key="ellipsis" className="bc-item bc-ellipsis-item">
                <button
                  type="button"
                  className="bc-ellipsis-btn"
                  aria-label="Show full path"
                  onClick={() => setExpanded(true)}
                >
                  …
                </button>
              </li>
            );
          }

          const isLast = index === visibleItems.length - 1;

          return (
            <li
              key={index}
              className={`bc-item${isLast ? " bc-item--last" : ""}`}
            >
              {item.path && !isLast ? (
                <Link to={item.path} className="bc-link">
                  {item.label}
                </Link>
              ) : (
                <span className="bc-current">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/* ── AutoBreadcrumb ── */
const AutoBreadcrumb = ({ dynamicLabelMap = {} }) => {
  const location = useLocation();

  const matchedEntry = Object.entries(breadcrumbMap).find(([path]) =>
    matchPath({ path, end: true }, location.pathname),
  );

  if (!matchedEntry) return null;

  let [, items] = matchedEntry;
  items = items.map((item) =>
    dynamicLabelMap[item.label]
      ? { ...item, label: dynamicLabelMap[item.label] }
      : item,
  );

  return <Breadcrumb items={items} />;
};

export default AutoBreadcrumb;
