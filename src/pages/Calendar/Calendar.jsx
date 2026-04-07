import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";
import GroupModal from "./Groupmodal";

const TIMEZONE = import.meta.env.VITE_TIMEZONE;

import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaSyncAlt,
  FaTimes,
  FaTrash,
  FaCalendarCheck,
} from "react-icons/fa";

// ── API helpers ───────────────────────────────────────────────
const getCalendar = (year, month) => {
  const params = new URLSearchParams();
  if (year)  params.set("year",  year);
  if (month) params.set("month", month);
  const qs = params.toString() ? `?${params}` : "";
  return api.get(`/api/attendance/calendar/${qs}`).then((r) => r.data);
};

const getCalendarYear = (year) =>
  api.get(`/api/attendance/calendar/?year=${year}`).then((r) => r.data);

const getGroup = (groupId) =>
  api.get(`/api/attendance/group/${groupId}/`).then((r) => r.data);

const deleteHoliday = (id) =>
  api.delete(`/api/attendance/holiday/${id}/delete/`).then((r) => r.data);

// ── Yearly stats ──────────────────────────────────────────────
const computeYearStats = (entries) => {
  let holidays = 0;
  const seenGroups = {};
  entries.forEach((e) => {
    if (e.day_type === "HOLIDAY") {
      holidays += 1;
    } else if (e.day_type === "FESTIVAL" && !seenGroups[e.group_id]) {
      seenGroups[e.group_id] = Number(e.max_allowed_leaves) || 0;
    }
  });
  const festivalGroups     = Object.keys(seenGroups).length;
  const festivalLeaveQuota = Object.values(seenGroups).reduce((s, v) => s + v, 0);
  return { holidays, festivalGroups, festivalLeaveQuota, total: holidays + festivalLeaveQuota };
};

// ── Constants ─────────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const toISO = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const buildDayMap = (holidays) => {
  const map = {};
  holidays.forEach((h) => { map[h.date] = h; });
  return map;
};

// ─────────────────────────────────────────────────────────────
export default function Calendar() {
  const navigate = useNavigate();
  const today = new Date();

  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [holidays, setHolidays] = useState([]);
  const [dayMap,   setDayMap]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const [yearStats,    setYearStats]    = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [groupData,    setGroupData]    = useState(null);
  const [groupLoading, setGroupLoading] = useState(false);

  // ── Popup ─────────────────────────────────────────────────────
  const [popupConfig, setPopupConfig] = useState({
    show: false, type: "info", title: "", message: "",
    confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null,
  });
  const openPopup = (config) =>
    setPopupConfig({
      show: true, type: "info", title: "", message: "",
      confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null,
      ...config,
    });
  const closePopup = () => setPopupConfig((prev) => ({ ...prev, show: false }));

  // ── Fetch yearly stats ────────────────────────────────────────
  const fetchYearStats = useCallback(async (y) => {
    setStatsLoading(true);
    try {
      const res = await getCalendarYear(y);
      setYearStats(computeYearStats(res.calendar || []));
    } catch {
      setYearStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch month calendar ──────────────────────────────────────
  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCalendar(year, month + 1);
      setHolidays(res.calendar || []);
      setDayMap(buildDayMap(res.calendar || []));
    } catch (err) {
      openPopup({
        type: "error", title: "Error",
        message: err.response?.data?.message || "Failed to load calendar.",
      });
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchCalendar();      }, [fetchCalendar]);
  useEffect(() => { fetchYearStats(year); }, [year, fetchYearStats]);

  // ── Month nav ─────────────────────────────────────────────────
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // ── Handlers ─────────────────────────────────────────────────
  const handleDayClick = async (isoOrDate) => {
    const entry = dayMap[isoOrDate] || holidays.find((h) => h.date === isoOrDate);
    if (!entry || entry.day_type !== "FESTIVAL" || !entry.group_id) return;
    setGroupLoading(true);
    try {
      const data = await getGroup(entry.group_id);
      setGroupData(data);
    } catch (err) {
      openPopup({
        type: "error", title: "Error",
        message: err.response?.data?.message || "Failed to load group details.",
      });
    } finally {
      setGroupLoading(false);
    }
  };

  const confirmDelete = (entry) => {
    openPopup({
      type: "warning",
      title: "Delete Holiday?",
      message: `Remove "${entry.name}" (${new Date(entry.date + "T00:00:00").toLocaleDateString("en-IN", { timeZone: TIMEZONE })}) from the calendar? This cannot be undone.`,
      showCancel: true,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: () => handleDelete(entry),
    });
  };

  const handleDelete = async (entry) => {
    closePopup();
    try {
      await deleteHoliday(entry.id);
      fetchCalendar();
      fetchYearStats(year);
    } catch (err) {
      openPopup({
        type: "error", title: "Delete Failed",
        message: err.response?.data?.message || "Failed to delete holiday.",
      });
    }
  };

  // ── Grid helpers ──────────────────────────────────────────────
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getCellStyle = (iso) => {
    const entry = dayMap[iso];
    if (!entry) return {};
    if (entry.day_type === "HOLIDAY")
      return { background: "rgba(239,68,68,0.12)", border: "1.5px solid rgba(239,68,68,0.35)" };
    if (entry.day_type === "FESTIVAL")
      return { background: "rgba(245,158,11,0.13)", border: "1.5px solid rgba(245,158,11,0.4)", cursor: "pointer" };
    return {};
  };

  const isToday = (y, m, d) =>
    y === today.getFullYear() && m === today.getMonth() && d === today.getDate();

  const holidayCount  = holidays.filter((h) => h.day_type === "HOLIDAY").length;
  const festivalCount = holidays.filter((h) => h.day_type === "FESTIVAL").length;

  const statCards = [
    {
      icon:  <FaCalendarCheck />,
      label: "Total Holidays In a Year",
      value: yearStats ? yearStats.total : null,
      color: "#0891b2",
      bg:    "rgba(8,145,178,0.1)",
    },
  ];

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AutoBreadcrumb />

          <div className="cal-stats-bar" />

          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <h2 className="section-heading" style={{ marginBottom: 0, border: "none" }}>
                <FaCalendarAlt className="domain-icon" style={{ fontSize: 20 }} />  Calendar
              </h2>

              {statCards.map(({ icon, label, value, sub, color, bg }) => (
                <div key={label} className="cal-stat-card">
                  <span className="cal-stat-icon" style={{ color, background: bg }}>{icon}</span>
                  <div className="cal-stat-body">
                    <span className="cal-stat-label">{label}</span>
                    <span className="cal-stat-value">
                      {statsLoading ? <span className="cal-stat-shimmer" /> : value}
                    </span>
                    <span className="cal-stat-sub">{statsLoading ? "" : sub}</span>
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-sort" onClick={prevMonth} title="Previous month">
                  <FaChevronLeft style={{ fontSize: 13 }} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 16, minWidth: 160, textAlign: "center" }}>
                  {MONTHS[month]} {year}
                </span>
                <button className="btn btn-sort" onClick={nextMonth} title="Next month">
                  <FaChevronRight style={{ fontSize: 13 }} />
                </button>
                <button
                  className="btn btn-primary"
                  style={{ padding: "5px 12px", fontSize: 13 }}
                  onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
                >
                  Today
                </button>
                <button
                  className="btn btn-primary"
                  style={{ padding: "5px 12px", fontSize: 13 }}
                  onClick={() => navigate("/attendance/holiday/add")}
                >
                  <FaPlus style={{ fontSize: 13 }} />
                  Add Holiday
                </button>
              </div>
            </div>

            {/* ── Legend ── */}
            <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              {[
                { color: "rgba(239,68,68,0.18)",  border: "rgba(239,68,68,0.4)",   label: `Holiday (${holidayCount})`  },
                { color: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.45)", label: `Festival (${festivalCount})` },
                { color: "rgba(11,145,172,0.12)", border: "var(--primary)",         label: "Today"                      },
              ].map(({ color, border, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 3, background: color, border: `1.5px solid ${border}`, display: "inline-block" }} />
                  {label}
                </div>
              ))}
              {groupLoading && (
                <span style={{ fontSize: 13, color: "var(--neutral-400)" }}>Loading group…</span>
              )}
            </div>

            {/* ── Calendar Grid ── */}
            {loading ? (
              <div style={{ textAlign: "center", padding: 60, color: "var(--neutral-400)" }}>
                <FaSyncAlt style={{ fontSize: 36, display: "block", margin: "0 auto 8px", animation: "calSpin 1s linear infinite" }} />
                Loading calendar…
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: "var(--radius-md)", border: "1px solid var(--neutral-200)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                {/* Day headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "2px solid var(--accent)" }}>
                  {DAYS.map((d) => (
                    <div key={d} style={{ padding: "10px 4px", textAlign: "center", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--neutral-500)", background: "var(--neutral-50)" }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                  {cells.map((day, idx) => {
                    if (!day) {
                      return (
                        <div key={`e-${idx}`} style={{ minHeight: 80, borderRight: "1px solid var(--neutral-100)", borderBottom: "1px solid var(--neutral-100)", background: "var(--neutral-50)" }} />
                      );
                    }

                    const iso       = toISO(year, month, day);
                    const entry     = dayMap[iso];
                    const todayFlag = isToday(year, month, day);
                    const cellStyle = getCellStyle(iso);

                    return (
                      <div
                        key={iso}
                        onClick={() => entry && handleDayClick(iso)}
                        style={{
                          minHeight: 80,
                          borderRight: "1px solid var(--neutral-100)",
                          borderBottom: "1px solid var(--neutral-100)",
                          padding: "8px 6px 6px",
                          position: "relative",
                          transition: "background 0.15s",
                          ...(todayFlag && !entry ? { background: "rgba(11,145,172,0.07)", border: "1.5px solid var(--primary)" } : {}),
                          ...cellStyle,
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%", fontSize: 13, fontWeight: todayFlag ? 700 : 500, background: todayFlag ? "var(--primary)" : "transparent", color: todayFlag ? "#fff" : entry ? "var(--neutral-900)" : "var(--neutral-700)", marginBottom: 4 }}>
                          {day}
                        </span>

                        {entry && (
                          <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3, color: entry.day_type === "HOLIDAY" ? "#dc2626" : "#b45309", wordBreak: "break-word" }}>
                            {entry.name}
                            {entry.day_type === "FESTIVAL" && (
                              <span style={{ display: "block", fontSize: 10, color: "var(--neutral-400)" }}>tap for details</span>
                            )}
                          </div>
                        )}

                        {entry && (
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmDelete(entry); }}
                            title="Remove"
                            style={{ position: "absolute", top: 4, right: 4, background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--neutral-300)", lineHeight: 1, borderRadius: "var(--radius-sm)", transition: "color 0.15s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--neutral-300)")}
                          >
                            <FaTimes style={{ fontSize: 12 }} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Holiday Table ── */}
            {holidays.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <h3 className="section-title" style={{ margin: 0 }}>
                    Holidays &amp; Festivals — {MONTHS[month]} {year}
                  </h3>
                  {holidays.length > 5 && (
                    <span style={{ fontSize: 12, color: "var(--neutral-400)", fontStyle: "italic" }}>
                      Showing all {holidays.length} entries · scroll to see more
                    </span>
                  )}
                </div>

                <div className="cal-table-scroll">
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Group ID</th>
                          <th>Max Leaves</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holidays.map((h, i) => (
                          <tr key={h.id}>
                            <td data-label="#">{i + 1}</td>
                            <td data-label="Name" style={{ fontWeight: 600 }}>{h.name}</td>
                            <td data-label="Date">
                              {new Date(h.date + "T00:00:00").toLocaleDateString("en-IN", { timeZone: TIMEZONE, day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            <td data-label="Type">
                              <span style={{ padding: "2px 10px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 700, background: h.day_type === "HOLIDAY" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)", color: h.day_type === "HOLIDAY" ? "#dc2626" : "#b45309" }}>
                                {h.day_type}
                              </span>
                            </td>
                            <td data-label="Group ID">
                              {h.group_id ? (
                                <button onClick={() => handleDayClick(h.date)} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0, textDecoration: "underline" }}>
                                  {h.group_id}
                                </button>
                              ) : (
                                <span style={{ color: "var(--neutral-400)" }}>—</span>
                              )}
                            </td>
                            <td data-label="Max Leaves">
                              {h.max_allowed_leaves ?? <span style={{ color: "var(--neutral-400)" }}>—</span>}
                            </td>
                            <td data-label="Actions">
                              <div className="actions">
                                <button className="action-btn delete-btn" title="Delete" onClick={() => confirmDelete(h)}>
                                  <FaTrash style={{ fontSize: 14 }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Group Modal ── */}
      {groupData && <GroupModal groupData={groupData} onClose={() => setGroupData(null)} />}

      {/* ── Popup (replaces custom delete confirm + error state) ── */}
      <Popup
        show={popupConfig.show}
        type={popupConfig.type}
        title={popupConfig.title}
        message={popupConfig.message}
        onClose={closePopup}
        onConfirm={popupConfig.onConfirm || closePopup}
        confirmText={popupConfig.confirmText}
        cancelText={popupConfig.cancelText}
        showCancel={popupConfig.showCancel}
      />

      <style>{`
        .cal-stats-bar {
          display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 20px;
        }
        .cal-stat-card {
          display: flex; align-items: center; gap: 14px;
          background: #fff; border: 1px solid var(--border, #e5e7eb);
          border-radius: var(--radius-sm, 8px); padding: 14px 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .cal-stat-icon {
          display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 10px; font-size: 16px; flex-shrink: 0;
        }
        .cal-stat-body  { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .cal-stat-value {
          font-size: 22px; font-weight: 800; line-height: 1.1;
          color: var(--text, #111); min-height: 26px; display: flex; align-items: center;
        }
        .cal-stat-label { font-size: 12px; font-weight: 600; color: var(--text, #374151); }
        .cal-stat-sub   { font-size: 11px; color: var(--muted, #6b7280); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cal-stat-shimmer {
          display: inline-block; width: 36px; height: 20px; border-radius: 4px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: calShimmer 1.2s infinite;
        }
        @keyframes calShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .cal-table-scroll {
          max-height: calc(5 * 49px + 44px); overflow-y: auto;
          border: 1px solid var(--neutral-200, #e5e7eb); border-radius: var(--radius-sm, 6px);
        }
        .cal-table-scroll table thead th {
          position: sticky; top: 0; z-index: 1;
          background: var(--neutral-50, #f9fafb);
          box-shadow: 0 1px 0 var(--neutral-200, #e5e7eb);
        }
        .cal-table-scroll::-webkit-scrollbar { width: 6px; }
        .cal-table-scroll::-webkit-scrollbar-track { background: transparent; }
        .cal-table-scroll::-webkit-scrollbar-thumb { background: var(--neutral-300, #d1d5db); border-radius: 999px; }
        .cal-table-scroll::-webkit-scrollbar-thumb:hover { background: var(--neutral-400, #9ca3af); }
        @keyframes calSpin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}