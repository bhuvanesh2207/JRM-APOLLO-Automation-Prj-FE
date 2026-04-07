import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  FaCheckCircle, FaTimesCircle, FaDownload, FaSearch,
  FaBolt, FaChevronDown, FaCalendarAlt, FaFilter,
  FaChevronLeft, FaChevronRight, FaTrash,
} from "react-icons/fa";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const TIMEZONE = import.meta.env.VITE_TIMEZONE;

/* ─── Helpers ─────────────────────────────────────────── */
const fmt12 = (dt) => {
  if (!dt) return "—";
  let d = new Date(dt);
  if (isNaN(d)) return dt;
  const istTime = d.toLocaleString('en-IN', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const [timePart] = istTime.split(',').map(s => s.trim());
  return timePart;
};

const fmtHrs = (val) => {
  const n = parseFloat(val || 0);
  if (isNaN(n)) return "—";
  const h = Math.floor(n), m = Math.round((n - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July",
                     "August","September","October","November","December"];

const DEPARTMENTS = [
  { value: "",                   label: "All Departments"   },
  { value: "software_developer", label: "Software Developer"},
  { value: "graphic_designer",   label: "Graphic Designer"  },
  { value: "web_designer",       label: "Web Designer"      },
  { value: "ui_ux_designer",     label: "UI/UX Designer"    },
  { value: "business_analyst",   label: "Business Analyst"  },
];

const APPROVAL_FILTERS = [
  { value: "all",      label: "All"      },
  { value: "pending",  label: "Pending"  },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
];

/* ─── Toast ───────────────────────────────────────────── */
const Toast = ({ toasts }) => (
  <div className="toast-stack">
    {toasts.map((t) => (
      <div key={t.id} className={`toast toast--${t.type}`}>
        {t.type === "success" ? <FaCheckCircle /> : <FaTimesCircle />}
        <span>{t.message}</span>
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════ */
const OvertimeApproval = () => {
  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [dept,           setDept]           = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [search,         setSearch]         = useState("");
  const [showDeptDrop,   setShowDeptDrop]   = useState(false);
  const [showApprDrop,   setShowApprDrop]   = useState(false);
  const deptRef = useRef(null);
  const apprRef = useRef(null);

  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const [toasts,  setToasts]  = useState([]);
  const toastId = useRef(0);

  const [popup, setPopup] = useState({
    show: false, type: "info", title: "", message: "",
    confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null,
  });

  /* ── Toast / popup helpers ── */
  const addToast   = (message, type = "success") => {
    const id = ++toastId.current;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };
  const openPopup  = (cfg) => setPopup({ show:true, type:"info", title:"", message:"", confirmText:"OK", cancelText:"Cancel", showCancel:false, onConfirm:null, ...cfg });
  const closePopup = ()    => setPopup((p) => ({ ...p, show:false }));

  /* ── Outside click ── */
  useEffect(() => {
    const h = (e) => {
      if (deptRef.current && !deptRef.current.contains(e.target)) setShowDeptDrop(false);
      if (apprRef.current && !apprRef.current.contains(e.target)) setShowApprDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Date list for current month ── */
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const dateList    = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(viewYear, viewMonth, i + 1);
    return d.toISOString().slice(0, 10);
  });

  /* ── Fetch month ── */
  const fetchMonth = useCallback(async () => {
    setLoading(true);
    setError("");
    setAllData({});
    try {
      const params = {
        year:  viewYear,
        month: viewMonth + 1,
        ...(dept && { department: dept }),
        ...(approvalFilter !== "all" && { status: approvalFilter }),
      };
      const res  = await api.get("/api/attendance/overtime/", { params });
      const rows = res.data.results || [];

      const grouped = {};
      rows.forEach((r) => {
        const d = r.date;
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(r);
      });
      setAllData(grouped);
    } catch {
      setError("Failed to fetch overtime data.");
    } finally {
      setLoading(false);
    }
  }, [viewYear, viewMonth, dept, approvalFilter]);

  useEffect(() => { fetchMonth(); }, [fetchMonth]);

  /* ── Month navigation ── */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  /* ── Mutators ── */
  const updateRow = (date, id, patch) =>
    setAllData((prev) => ({
      ...prev,
      [date]: (prev[date] || []).map((r) => r.id === id ? { ...r, ...patch } : r),
    }));

  const removeRow = (date, id) =>
    setAllData((prev) => ({
      ...prev,
      [date]: (prev[date] || []).filter((r) => r.id !== id),
    }));

  /* ── Approve ── */
  const handleApprove = (date, row) => {
    openPopup({
      type: "info", title: "Approve Overtime",
      message: `Approve OT for ${row.employee_name} (${fmtHrs(row.extra_hours)} extra)?`,
      showCancel: true, confirmText: "Approve", cancelText: "Cancel",
      onConfirm: async () => {
        closePopup();
        try {
          await api.post(`/api/attendance/overtime/${row.id}/approve/`);
          updateRow(date, row.id, { status: "approved" });
          addToast(`${row.employee_name} OT approved.`, "success");
        } catch {
          addToast("Failed to approve OT.", "error");
        }
      },
    });
  };

  /* ── Decline ── */
  const handleDecline = (date, row) => {
    openPopup({
      type: "info", title: "Decline Overtime",
      message: `Decline OT for ${row.employee_name}?`,
      showCancel: true, confirmText: "Decline", cancelText: "Cancel",
      onConfirm: async () => {
        closePopup();
        try {
          await api.post(`/api/attendance/overtime/${row.id}/decline/`);
          updateRow(date, row.id, { status: "declined" });
          addToast(`${row.employee_name} OT declined.`, "success");
        } catch {
          addToast("Failed to decline OT.", "error");
        }
      },
    });
  };

  /* ── Delete ── */
  const handleDelete = (date, row) => {
    openPopup({
      type: "info", title: "Delete OT Record",
      message: `Permanently delete ${row.employee_name}'s OT record?\nThis cannot be undone.`,
      showCancel: true, confirmText: "Delete", cancelText: "Cancel",
      onConfirm: async () => {
        closePopup();
        try {
          await api.delete(`/api/attendance/overtime/${row.id}/delete/`);
          removeRow(date, row.id);
          addToast(`${row.employee_name} OT record deleted.`, "success");
        } catch {
          addToast("Failed to delete OT record.", "error");
        }
      },
    });
  };

  /* ── Export CSV ── */
  const exportCSV = () => {
    const header  = ["Date","Employee","ID","Check-in","Check-out","Extra Hrs","OT Status"];
    const csvRows = [];
    dateList.forEach((date) => {
      (allData[date] || []).forEach((r) => {
        csvRows.push([
          date, r.employee_name, r.employee_id,
          fmt12(r.check_in), fmt12(r.check_out),
          fmtHrs(r.extra_hours),
          r.status.charAt(0).toUpperCase() + r.status.slice(1),
        ]);
      });
    });
    const csv  = [header, ...csvRows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `overtime_${viewYear}_${viewMonth + 1}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Per-date filtered rows ── */
  const getFilteredRows = (date) =>
    (allData[date] || []).filter((r) => {
      if (search) {
        const t = search.toLowerCase();
        if (!r.employee_name?.toLowerCase().includes(t) &&
            !r.employee_id?.toLowerCase().includes(t)) return false;
      }
      return true;
    });

  const activeDates = dateList.filter((d) => getFilteredRows(d).length > 0);
  const todayStr    = new Date().toISOString().slice(0, 10);

  /* ── Render ── */
  return (
    <main className="app-main">
      <Toast toasts={toasts} />
      <div className="ot-page">
        <AutoBreadcrumb />

        {/* Header */}
        <div className="ot-page-header">
          <div>
            <h1 className="ot-page-title">
              <FaBolt className="ot-title-icon" /> Overtime
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-export" onClick={exportCSV}>
              <FaDownload /> Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="ot-filters-bar">

          {/* Month nav */}
          <div className="ot-filter-group">
            <label className="ot-filter-label"><FaCalendarAlt /> Month</label>
            <div className="month-nav">
              <button className="month-nav-btn" onClick={prevMonth}><FaChevronLeft /></button>
              <span className="month-nav-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <button className="month-nav-btn" onClick={nextMonth}><FaChevronRight /></button>
            </div>
          </div>

          {/* Department */}
          <div className="ot-filter-group" ref={deptRef}>
            <label className="ot-filter-label"><FaFilter /> Department</label>
            <button className="ot-select-btn" onClick={() => setShowDeptDrop((v) => !v)}>
              <span>{DEPARTMENTS.find((d) => d.value === dept)?.label}</span>
              <FaChevronDown className="ot-select-caret" />
            </button>
            {showDeptDrop && (
              <div className="ot-dropdown">
                {DEPARTMENTS.map((d) => (
                  <button key={d.value} className="ot-dropdown-opt"
                    onClick={() => { setDept(d.value); setShowDeptDrop(false); }}>
                    <span className={`ot-dropdown-check${dept === d.value ? " checked" : ""}`} />
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Approval filter */}
          <div className="ot-filter-group" ref={apprRef}>
            <label className="ot-filter-label"><FaCheckCircle /> Approval</label>
            <button className="ot-select-btn" onClick={() => setShowApprDrop((v) => !v)}>
              <span>{APPROVAL_FILTERS.find((f) => f.value === approvalFilter)?.label}</span>
              <FaChevronDown className="ot-select-caret" />
            </button>
            {showApprDrop && (
              <div className="ot-dropdown">
                {APPROVAL_FILTERS.map((f) => (
                  <button key={f.value} className="ot-dropdown-opt"
                    onClick={() => { setApprovalFilter(f.value); setShowApprDrop(false); }}>
                    <span className={`ot-dropdown-check${approvalFilter === f.value ? " checked" : ""}`} />
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="ot-filter-group ot-filter-search">
            <FaSearch className="ot-search-icon" />
            <input
              type="text" className="ot-search-input"
              placeholder="Search employee…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="ot-state-msg"><div className="ot-spinner" /> Loading overtime data…</div>
        ) : error ? (
          <div className="ot-state-msg ot-state-msg--error">{error}</div>
        ) : activeDates.length === 0 ? (
          <div className="ot-state-msg">No overtime records found for {MONTH_NAMES[viewMonth]} {viewYear}.</div>
        ) : (
          <div className="ot-grid-scroll">
            <div className="ot-grid" style={{ gridTemplateColumns: `repeat(${activeDates.length}, 230px)` }}>
              {activeDates.map((date) => {
                const rows    = getFilteredRows(date);
                const d       = new Date(date + "T00:00:00");
                const isToday = date === todayStr;

                return (
                  <div key={date} className={`ot-date-col${isToday ? " ot-date-col--today" : ""}`}>
                    {/* Date header */}
                    <div className="ot-date-header">
                      <span className={`ot-day-num${isToday ? " today" : ""}`}>{d.getDate()}</span>
                      <span className="ot-day-name">{DAY_NAMES[d.getDay()]}</span>
                      <span className="ot-emp-count">{rows.length} emp</span>
                    </div>

                    {/* Compact cards */}
                    <div className="ot-cards-list">
                      {rows.map((row) => (
                        <div key={row.id} className={`ot-card ot-card--${row.status}`}>

                          {/* Line 1: date label + action icons */}
                          <div className="ot-card-row1">
                            <span className={`ot-card-status-dot ot-dot--${row.status}`} title={row.status} />
                            <span className="ot-card-date-lbl">
                              {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                            </span>
                            <div className="ot-card-actions-inline">
                              {row.status !== "approved" && (
                                <button
                                  className="ot-icon-btn ot-icon-btn--approve"
                                  title="Approve"
                                  onClick={() => handleApprove(date, row)}
                                >
                                  <FaCheckCircle />
                                </button>
                              )}
                              {row.status !== "declined" && (
                                <button
                                  className="ot-icon-btn ot-icon-btn--decline"
                                  title="Decline"
                                  onClick={() => handleDecline(date, row)}
                                >
                                  <FaTimesCircle />
                                </button>
                              )}
                              <button
                                className="ot-icon-btn ot-icon-btn--delete"
                                title="Delete"
                                onClick={() => handleDelete(date, row)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>

                          {/* Line 2: avatar + name/id + OT hrs */}
                          <div className="ot-card-row2">
                            <div className="ot-card-avatar">
                              {(row.employee_name || "?")[0].toUpperCase()}
                            </div>
                            <div className="ot-card-name-wrap">
                              <span className="ot-card-name">{row.employee_name}</span>
                              <span className="ot-card-id">{row.employee_id}</span>
                            </div>
                            <div className="ot-card-extra-sm">
                              <FaBolt className="ot-card-bolt" />
                              <span className="ot-card-extra-val">{fmtHrs(row.extra_hours)}</span>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Styles ── */}
      <style>{`
        /* Page */
        .ot-page { max-width:100%;margin:0 auto;padding:24px 16px 48px;display:flex;flex-direction:column;gap:20px }
        .ot-page-header { display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px }
        .ot-page-title { display:flex;align-items:center;gap:10px;font-size:22px;font-weight:800;color:#0b91ac;margin:0 0 4px }
        .ot-title-icon { color:#0b91ac;font-size:18px }

        /* Export btn */
        .btn-export { display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;cursor:pointer;transition:all .15s }
        .btn-export:hover { background:#e2e8f0;color:#1e293b }

        /* Filters bar */
        .ot-filters-bar { display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap;padding:16px 20px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,.04) }
        .ot-filter-group { display:flex;flex-direction:column;gap:5px;position:relative }
        .ot-filter-label { display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px }

        /* Month nav */
        .month-nav { display:flex;align-items:center;gap:8px;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;background:#fff }
        .month-nav-btn { background:none;border:none;cursor:pointer;color:#64748b;font-size:12px;padding:2px 5px;border-radius:4px;transition:background .1s }
        .month-nav-btn:hover { background:#f1f5f9;color:#1e293b }
        .month-nav-label { font-size:13px;font-weight:700;color:#1e293b;min-width:140px;text-align:center }

        /* Select dropdowns */
        .ot-select-btn { display:flex;align-items:center;justify-content:space-between;gap:20px;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;color:#374151;background:#fff;cursor:pointer;min-width:150px;transition:border-color .15s }
        .ot-select-btn:hover { border-color:#0b91ac }
        .ot-select-caret { font-size:10px;color:#94a3b8 }
        .ot-dropdown { position:absolute;top:calc(100% + 4px);left:0;z-index:200;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.1);min-width:180px;overflow:hidden }
        .ot-dropdown-opt { display:flex;align-items:center;gap:8px;padding:9px 14px;font-size:13px;color:#374151;background:none;border:none;cursor:pointer;width:100%;text-align:left;transition:background .1s }
        .ot-dropdown-opt:hover { background:#f0f9fb }
        .ot-dropdown-check { width:14px;height:14px;border-radius:3px;border:1.5px solid #cbd5e1;display:inline-block;flex-shrink:0 }
        .ot-dropdown-check.checked { background:#0b91ac;border-color:#0b91ac }

        /* Search */
        .ot-filter-search { flex:1;min-width:180px;flex-direction:row;align-items:center;position:relative }
        .ot-search-icon { position:absolute;left:10px;color:#94a3b8;font-size:13px;top:50%;transform:translateY(-50%) }
        .ot-search-input { padding:8px 12px 8px 32px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;color:#1e293b;outline:none;width:100%;transition:border-color .15s }
        .ot-search-input:focus { border-color:#0b91ac }

        /* Grid scroll */
        .ot-grid-scroll { overflow-x:auto;padding-bottom:12px }
        .ot-grid-scroll::-webkit-scrollbar { height:6px }
        .ot-grid-scroll::-webkit-scrollbar-track { background:#f1f5f9;border-radius:3px }
        .ot-grid-scroll::-webkit-scrollbar-thumb { background:#cbd5e1;border-radius:3px }
        .ot-grid { display:grid;gap:14px;min-width:max-content;padding:4px 2px 8px }

        /* Date column */
        .ot-date-col { display:flex;flex-direction:column;gap:8px;width:230px }
        .ot-date-header { display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.04) }
        .ot-date-col--today .ot-date-header { border-color:#0b91ac;background:#f0f9fb }
        .ot-day-num { font-size:20px;font-weight:800;color:#1e293b;line-height:1 }
        .ot-day-num.today { color:#0b91ac }
        .ot-day-name { font-size:12px;font-weight:600;color:#64748b;flex:1 }
        .ot-emp-count { font-size:11px;font-weight:600;background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:10px;border:1px solid #e2e8f0 }

        /* Cards list */
        .ot-cards-list { display:flex;flex-direction:column;gap:7px }

        /* ── Compact card ── */
        .ot-card {
          background:#fff;border:1px solid #e2e8f0;border-radius:10px;
          padding:8px 10px;display:flex;flex-direction:column;gap:6px;
          box-shadow:0 1px 3px rgba(0,0,0,.04);transition:box-shadow .15s;
        }
        .ot-card:hover { box-shadow:0 3px 10px rgba(0,0,0,.08) }
        .ot-card--pending  { border-left:3px solid #f59e0b }
        .ot-card--approved { border-left:3px solid #22c55e }
        .ot-card--declined { border-left:3px solid #ef4444 }

        /* Row 1 */
        .ot-card-row1 {
          display:flex;align-items:center;gap:5px;
        }
        .ot-card-status-dot {
          width:7px;height:7px;border-radius:50%;flex-shrink:0;
        }
        .ot-dot--pending  { background:#f59e0b }
        .ot-dot--approved { background:#22c55e }
        .ot-dot--declined { background:#ef4444 }
        .ot-card-date-lbl {
          font-size:10.5px;font-weight:600;color:#94a3b8;flex:1;
        }
        .ot-card-actions-inline {
          display:flex;align-items:center;gap:2px;
        }
        .ot-icon-btn {
          background:none;border:none;cursor:pointer;
          padding:3px 4px;border-radius:5px;font-size:12px;
          transition:all .15s;line-height:1;
        }
        .ot-icon-btn--approve { color:#22c55e }
        .ot-icon-btn--approve:hover { background:#f0fdf4;color:#15803d }
        .ot-icon-btn--decline { color:#ef4444 }
        .ot-icon-btn--decline:hover { background:#fef2f2;color:#dc2626 }
        .ot-icon-btn--delete  { color:#cbd5e1 }
        .ot-icon-btn--delete:hover  { background:#fef2f2;color:#ef4444 }

        /* Row 2 */
        .ot-card-row2 {
          display:flex;align-items:center;gap:7px;
        }
        .ot-card-avatar {
          width:26px;height:26px;border-radius:50%;
          background:#e0f7f9;color:#0b91ac;font-weight:700;font-size:11px;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .ot-card-name-wrap {
          flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;
        }
        .ot-card-name {
          font-size:12px;font-weight:700;color:#1e293b;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        }
        .ot-card-id { font-size:10px;color:#94a3b8 }
        .ot-card-extra-sm {
          display:flex;align-items:center;gap:3px;
          background:#fffbeb;border:1px solid #fde68a;
          border-radius:6px;padding:3px 7px;flex-shrink:0;
        }
        .ot-card-bolt  { color:#f59e0b;font-size:10px }
        .ot-card-extra-val { font-size:12px;font-weight:800;color:#b45309 }

        /* State messages */
        .ot-state-msg { display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:60px 20px;color:#94a3b8;font-size:14px }
        .ot-state-msg--error { color:#dc2626 }
        .ot-spinner { width:32px;height:32px;border:3px solid #e2e8f0;border-top-color:#0b91ac;border-radius:50%;animation:spin .7s linear infinite }
        @keyframes spin { to { transform:rotate(360deg) } }

        /* Toasts */
        .toast-stack { position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px }
        .toast { display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:10px;font-size:13.5px;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,.12);min-width:240px;animation:slideUp .25s ease }
        @keyframes slideUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
        .toast--success { background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0 }
        .toast--error   { background:#fef2f2;color:#dc2626;border:1px solid #fecaca }
      `}</style>

      <Popup
        show={popup.show} type={popup.type}
        title={popup.title} message={popup.message}
        onClose={closePopup}
        onConfirm={popup.onConfirm || closePopup}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        showCancel={popup.showCancel}
      />
    </main>
  );
};

export default OvertimeApproval;