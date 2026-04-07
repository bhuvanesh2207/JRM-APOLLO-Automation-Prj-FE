// src/pages/Calendar/Groupmodal.jsx
// No external imports — fully self-contained (uses react-icons/fa).

import { useEffect } from "react";
import { FaTimes, FaGift, FaCalendarCheck, FaCalendarDay } from "react-icons/fa";

const TIMEZONE = import.meta.env.VITE_TIMEZONE;

export default function GroupModal({ groupData, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!groupData) return null;

  const { group_id, max_allowed_leaves, dates = [] } = groupData;

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      timeZone: TIMEZONE,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="popup-backdrop" onClick={onClose}>
      <div
        className="popup-box"
        style={{ maxWidth: 460, textAlign: "left" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button className="popup-close-btn" onClick={onClose} aria-label="Close">
          <FaTimes style={{ fontSize: 14 }} />
        </button>

        {/* Icon */}
        <div className="popup-icon popup-icon--warning" style={{ margin: "0 auto 16px" }}>
          <FaGift style={{ fontSize: 22 }} />
        </div>

        {/* Title */}
        <h2 className="popup-title" style={{ textAlign: "center" }}>
          {dates[0]?.name || group_id}
        </h2>
        <p className="popup-message" style={{ textAlign: "center", marginBottom: 20 }}>
          Festival Group:{" "}
          <strong style={{ color: "var(--primary)" }}>{group_id}</strong>
        </p>

        {/* Max leaves badge */}
        {max_allowed_leaves != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 16 }}>
            <FaCalendarCheck style={{ color: "var(--warning)", fontSize: 16, flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: "var(--neutral-700)" }}>
              Max allowed leaves for this festival:{" "}
              <strong style={{ color: "var(--warning)" }}>{max_allowed_leaves}</strong>
            </span>
          </div>
        )}

        {/* Date list */}
        <div style={{ border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {dates.map((d, i) => (
            <div
              key={d.id}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: i < dates.length - 1 ? "1px solid var(--neutral-100)" : "none", background: i % 2 === 0 ? "#fff" : "var(--neutral-50)" }}
            >
              <FaCalendarDay style={{ color: "#f59e0b", fontSize: 16, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--neutral-700)" }}>{d.name}</div>
                <div style={{ fontSize: 12, color: "var(--neutral-400)" }}>{formatDate(d.date)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="popup-actions" style={{ justifyContent: "center" }}>
          <button className="popup-btn popup-btn--cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}