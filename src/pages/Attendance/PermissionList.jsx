import React, { useEffect, useState, useRef } from "react";
import { FaClipboardList, FaPlus, FaEdit, FaTrashAlt, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaTimes, FaClock } from "react-icons/fa";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const TIMEZONE = import.meta.env.VITE_TIMEZONE;

/* ── Helpers ── */
const fmt12 = (t) => {
  if (!t) return "—";
  const [hRaw, m] = t.split(":");
  const h = parseInt(hRaw, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_META = {
  pending:  { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Pending"  },
  approved: { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", label: "Approved" },
  rejected: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Rejected" },
};

const EMPTY_FORM = {
  employee:   "",
  date:       "",
  start_time: "",
  end_time:   "",
  duration:   "",
  reason:     "",
  status:     "pending",
};

/* ════════════════════════════════════════════════════════════ */
const PermissionList = () => {
  /* ── Date nav state (month picker) ── */
  const today = new Date();
  const [navYear,  setNavYear]  = useState(today.getFullYear());
  const [navMonth, setNavMonth] = useState(today.getMonth() + 1); // 1-based

  /* ── Data ── */
  const [permissions, setPermissions] = useState([]);
  const [employees,   setEmployees]   = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  /* ── Table controls ── */
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [entriesPerPage, setEntries]        = useState(10);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [showEntDrop,    setShowEntDrop]    = useState(false);
  const [showStatusDrop, setShowStatusDrop] = useState(false);

  /* ── Modal ── */
  const [modal,      setModal]      = useState({ open: false, mode: "add", data: null });
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving,     setSaving]     = useState(false);

  /* ── Popup ── */
  const [popupConfig, setPopupConfig] = useState({
    show: false, type: "info", title: "", message: "",
    confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null,
  });
  const openPopup  = (cfg) => setPopupConfig({ show: true, type: "info", title: "", message: "", confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null, ...cfg });
  const closePopup = ()    => setPopupConfig((p) => ({ ...p, show: false }));

  const entRef    = useRef(null);
  const statusRef = useRef(null);

  /* ── Fetch permissions for selected month ── */
  const fetchPermissions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/attendance/permissions/", {
        params: { year: navYear, month: navMonth },
      });
      if (res.data.success !== false) {
        setPermissions(res.data.permissions || res.data.results || res.data || []);
      } else {
        setError("Failed to fetch permissions.");
      }
    } catch {
      setError("Server error while fetching permissions.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch employees for dropdown ── */
  const fetchEmployees = async () => {
    try {
      const res = await api.get("/api/employees/list/");
      if (res.data.success) setEmployees(res.data.employees || []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchPermissions(); }, [navYear, navMonth]);
  useEffect(() => { fetchEmployees(); }, []);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const h = (e) => {
      if (entRef.current    && !entRef.current.contains(e.target))    setShowEntDrop(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setShowStatusDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Month navigation ── */
  const prevMonth = () => {
    if (navMonth === 1) { setNavYear((y) => y - 1); setNavMonth(12); }
    else setNavMonth((m) => m - 1);
    setCurrentPage(1);
  };
  const nextMonth = () => {
    if (navMonth === 12) { setNavYear((y) => y + 1); setNavMonth(1); }
    else setNavMonth((m) => m + 1);
    setCurrentPage(1);
  };

  /* ── Auto-calc duration ── */
  const calcDuration = (start, end) => {
    if (!start || !end) return "";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) return "";
    return (mins / 60).toFixed(2);
  };

  /* ── Form change ── */
  const handleFormChange = (field, val) => {
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      if (field === "start_time" || field === "end_time") {
        next.duration = calcDuration(
          field === "start_time" ? val : prev.start_time,
          field === "end_time"   ? val : prev.end_time,
        );
      }
      return next;
    });
    setFormErrors((e) => ({ ...e, [field]: "" }));
  };

  /* ── Open add modal ── */
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModal({ open: true, mode: "add", data: null });
  };

  /* ── Open edit modal ── */
  const openEdit = (perm) => {
    setForm({
      employee:   perm.employee?.id || perm.employee || "",
      date:       perm.date || "",
      start_time: perm.start_time?.slice(0, 5) || "",
      end_time:   perm.end_time?.slice(0, 5) || "",
      duration:   perm.duration || "",
      reason:     perm.reason || "",
      status:     perm.status || "pending",
    });
    setFormErrors({});
    setModal({ open: true, mode: "edit", data: perm });
  };

  const closeModal = () => setModal({ open: false, mode: "add", data: null });

  /* ── Validate ── */
  const validate = () => {
    const errs = {};
    if (!form.employee)      errs.employee   = "Employee is required.";
    if (!form.date)          errs.date       = "Date is required.";
    if (!form.start_time)    errs.start_time = "Start time is required.";
    if (!form.end_time)      errs.end_time   = "End time is required.";
    if (!form.reason.trim()) errs.reason     = "Reason is required.";
    if (form.start_time && form.end_time && form.start_time >= form.end_time)
      errs.end_time = "End time must be after start time.";
    return errs;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        employee:   form.employee,
        date:       form.date,
        start_time: form.start_time,
        end_time:   form.end_time,
        duration:   form.duration || null,
        reason:     form.reason,
        status:     form.status,
      };

      if (modal.mode === "add") {
        await api.post("/api/attendance/permissions/add/", payload);
        openPopup({ type: "success", title: "Done", message: "Permission added successfully." });
      } else {
        await api.put(`/api/attendance/permissions/${modal.data.id}/edit/`, payload);
        openPopup({ type: "success", title: "Done", message: "Permission updated successfully." });
      }
      closeModal();
      fetchPermissions();
    } catch (err) {
      const msg = err?.response?.data?.errors
        ? JSON.stringify(err.response.data.errors)
        : "Server error. Please try again.";
      openPopup({ type: "error", title: "Error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = (perm) => {
    openPopup({
      type: "delete", title: "Delete Permission",
      message: `Delete permission for "${perm.employee_name || "this employee"}" on ${perm.date}?`,
      showCancel: true, confirmText: "Delete", cancelText: "Cancel",
      onConfirm: async () => {
        closePopup();
        try {
          await api.delete(`/api/attendance/permissions/${perm.id}/delete/`);
          fetchPermissions();
          openPopup({ type: "success", title: "Done", message: "Permission deleted." });
        } catch {
          openPopup({ type: "error", title: "Error", message: "Failed to delete permission." });
        }
      },
    });
  };

  /* ── Filter / Paginate ── */
  const filtered = permissions.filter((p) => {
    const t = search.toLowerCase();
    const matchSearch = !t ||
      p.employee_name?.toLowerCase().includes(t) ||
      p.employee_id?.toLowerCase().includes(t)   ||
      p.reason?.toLowerCase().includes(t);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalEntries = filtered.length;
  const totalPages   = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const paginated    = filtered.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  const startEntry   = totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endEntry     = Math.min(currentPage * entriesPerPage, totalEntries);

  /* ── Render ── */
  return (
    <main className="app-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AutoBreadcrumb />
        <div className="bg-white rounded-lg shadow-lg p-6">

          {/* ── Header ── */}
          <div className="table-header">
            <h2><FaClipboardList className="domain-icon" /> Permissions</h2>
            <button type="button" className="btn btn-secondary" onClick={openAdd}>
              <FaPlus style={{ marginRight: 4 }} /> Add Permission
            </button>
          </div>

          {/* ── Month Navigator ── */}
          <div className="perm-month-nav">
            <button type="button" className="month-nav-btn" onClick={prevMonth}>
              <FaChevronLeft />
            </button>
            <div className="month-nav-label">
              <FaCalendarAlt className="month-nav-icon" />
              <span>{MONTH_NAMES[navMonth - 1]} {navYear}</span>
            </div>
            <button type="button" className="month-nav-btn" onClick={nextMonth}>
              <FaChevronRight />
            </button>
          </div>

          {/* ── Controls ── */}
          {!loading && !error && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
              {/* Entries per page */}
              <div className="table-controls-left">
                <div className="sort-filter-wrapper sort-filter-wrapper-left" ref={entRef}>
                  <button type="button" className="btn btn-sort" onClick={() => setShowEntDrop((v) => !v)}>
                    <span>{entriesPerPage} / page</span>
                    <span className="sort-filter-caret" />
                  </button>
                  {showEntDrop && (
                    <div className="sort-filter-dropdown">
                      {[5, 10, 25, 50].map((n) => (
                        <button key={n} type="button" className="sort-filter-option"
                          onClick={() => { setEntries(n); setCurrentPage(1); setShowEntDrop(false); }}>
                          <span className={`sort-filter-checkbox${entriesPerPage === n ? " checked" : ""}`} />
                          <span>{n} entries per page</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Search + Status filter */}
              <div className="table-controls-right">
                <div className="table-search">
                  <input
                    type="text" value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    placeholder="Search permissions" aria-label="Search permissions"
                  />
                </div>
                <div className="sort-filter-wrapper" ref={statusRef}>
                  <button type="button" className="btn btn-sort" onClick={() => setShowStatusDrop((v) => !v)}>
                    <span>Status</span>
                    <span className="sort-filter-caret" />
                  </button>
                  {showStatusDrop && (
                    <div className="sort-filter-dropdown">
                      {["pending","approved","rejected"].map((s) => (
                        <button key={s} type="button" className="sort-filter-option"
                          onClick={() => { setStatusFilter(s); setCurrentPage(1); setShowStatusDrop(false); }}>
                          <span className={`sort-filter-checkbox${statusFilter === s ? " checked" : ""}`} />
                          <span style={{ textTransform:"capitalize" }}>{s}</span>
                        </button>
                      ))}
                      <div className="sort-filter-divider" />
                      <button type="button" className="sort-filter-option"
                        onClick={() => { setStatusFilter("all"); setCurrentPage(1); setShowStatusDrop(false); }}>
                        <span className={`sort-filter-checkbox${statusFilter === "all" ? " checked" : ""}`} />
                        <span>All</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Table ── */}
          {loading ? (
            <div className="no-data">Loading permissions...</div>
          ) : error ? (
            <div style={{ color:"var(--error)" }}>{error}</div>
          ) : totalEntries === 0 ? (
            <div className="no-data">No permissions found for {MONTH_NAMES[navMonth - 1]} {navYear}.</div>
          ) : (
            <>
              <div className="table-responsive">
                <table id="permissionsTable">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Duration</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((perm) => {
                      const sm = STATUS_META[perm.status] || STATUS_META.pending;
                      return (
                        <tr key={perm.id}>

                          <td data-label="Employee">
                            <strong>{perm.employee_name || `Emp #${perm.employee}`}</strong>
                            {perm.employee_id && (
                              <div className="text-sm text-gray">ID: {perm.employee_id}</div>
                            )}
                          </td>

                          <td data-label="Date">
                            {perm.date
                              ? new Date(perm.date).toLocaleDateString("en-IN", { timeZone: TIMEZONE, day:"2-digit", month:"short", year:"numeric" })
                              : "N/A"}
                          </td>

                          <td data-label="Time">
                            <div className="perm-time-cell">
                              <span className="perm-time-tag perm-time-start">
                                <FaClock style={{ fontSize:9 }} /> {fmt12(perm.start_time)}
                              </span>
                              <span className="perm-time-sep">→</span>
                              <span className="perm-time-tag perm-time-end">
                                <FaClock style={{ fontSize:9 }} /> {fmt12(perm.end_time)}
                              </span>
                            </div>
                          </td>

                          <td data-label="Duration">
                            {perm.duration ? (
                              <span className="perm-duration-badge">{perm.duration} hr{perm.duration !== "1.00" ? "s" : ""}</span>
                            ) : "—"}
                          </td>

                          <td data-label="Reason">
                            <span className="perm-reason" title={perm.reason}>{perm.reason}</span>
                          </td>

                          <td data-label="Status">
                            <span className="perm-status-badge" style={{
                              color: sm.color, background: sm.bg, border: `1px solid ${sm.border}`,
                            }}>
                              {sm.label}
                            </span>
                          </td>

                          <td data-label="Actions">
                            <div className="actions">
                              <button className="action-btn edit-btn" onClick={() => openEdit(perm)} title="Edit">
                                <FaEdit />
                              </button>
                              <button className="action-btn delete-btn" onClick={() => handleDelete(perm)} title="Delete">
                                <FaTrashAlt />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer / Pagination */}
              <div className="table-footer">
                <div className="entries-info">
                  {`Showing ${startEntry} to ${endEntry} of ${totalEntries} entries`}
                </div>
                <div className="pagination">
                  <button className="pagination-btn" disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Previous</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button key={pg}
                      className={`pagination-btn${currentPage === pg ? " active" : ""}`}
                      onClick={() => setCurrentPage(pg)}>{pg}</button>
                  ))}
                  <button className="pagination-btn" disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ════════════════ Add / Edit Modal ════════════════ */}
      {modal.open && (
        <div className="perm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="perm-modal">
            <div className="perm-modal-header">
              <h3>{modal.mode === "add" ? "Add Permission" : "Edit Permission"}</h3>
              <button className="perm-modal-close" onClick={closeModal}><FaTimes /></button>
            </div>

            <div className="perm-modal-body">
              <div className="perm-form-grid">

                {/* Employee */}
                <div className="perm-form-field">
                  <label>Employee <span className="req">*</span></label>
                  <select
                    value={form.employee}
                    onChange={(e) => handleFormChange("employee", e.target.value)}
                    className={formErrors.employee ? "input-error" : ""}
                  >
                    <option value="">Select employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.employee_id})
                      </option>
                    ))}
                  </select>
                  {formErrors.employee && <span className="field-error">{formErrors.employee}</span>}
                </div>

                {/* Date */}
                <div className="perm-form-field">
                  <label>Date <span className="req">*</span></label>
                  <input type="date" value={form.date}
                    onChange={(e) => handleFormChange("date", e.target.value)}
                    className={formErrors.date ? "input-error" : ""}
                  />
                  {formErrors.date && <span className="field-error">{formErrors.date}</span>}
                </div>

                {/* Start Time */}
                <div className="perm-form-field">
                  <label>Start Time <span className="req">*</span></label>
                  <input type="time" value={form.start_time}
                    onChange={(e) => handleFormChange("start_time", e.target.value)}
                    className={formErrors.start_time ? "input-error" : ""}
                  />
                  {formErrors.start_time && <span className="field-error">{formErrors.start_time}</span>}
                </div>

                {/* End Time */}
                <div className="perm-form-field">
                  <label>End Time <span className="req">*</span></label>
                  <input type="time" value={form.end_time}
                    onChange={(e) => handleFormChange("end_time", e.target.value)}
                    className={formErrors.end_time ? "input-error" : ""}
                  />
                  {formErrors.end_time && <span className="field-error">{formErrors.end_time}</span>}
                </div>

                {/* Duration (read-only auto) */}
                <div className="perm-form-field">
                  <label>Duration (hrs)</label>
                  <input type="text" value={form.duration} readOnly
                    placeholder="Auto-calculated"
                    style={{ background:"#f9fafb", color:"#6b7280", cursor:"default" }}
                  />
                </div>

                {/* Status */}
                <div className="perm-form-field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => handleFormChange("status", e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Reason (full width) */}
                <div className="perm-form-field perm-form-field-full">
                  <label>Reason <span className="req">*</span></label>
                  <textarea rows={3} value={form.reason}
                    onChange={(e) => handleFormChange("reason", e.target.value)}
                    placeholder="Enter reason for permission..."
                    className={formErrors.reason ? "input-error" : ""}
                  />
                  {formErrors.reason && <span className="field-error">{formErrors.reason}</span>}
                </div>

              </div>
            </div>

            <div className="perm-modal-footer">
              <button type="button" className="btn btn-outline" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving..." : modal.mode === "add" ? "Add Permission" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── Month Navigator ── */
        .perm-month-nav {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 20px; justify-content: center;
        }
        .month-nav-btn {
          background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px;
          width: 34px; height: 34px; display:flex; align-items:center; justify-content:center;
          cursor: pointer; color: #475569; transition: background 0.15s;
        }
        .month-nav-btn:hover { background: #e0f7f9; color: #0b91ac; border-color: #b2ebf2; }
        .month-nav-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 15px; font-weight: 600; color: #1e293b; min-width: 180px; justify-content: center;
        }
        .month-nav-icon { color: #0b91ac; font-size: 14px; }

        /* ── Time cells ── */
        .perm-time-cell { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
        .perm-time-tag {
          display:inline-flex; align-items:center; gap:3px;
          font-size:11.5px; font-weight:500; padding:2px 7px;
          border-radius:10px; white-space:nowrap;
        }
        .perm-time-start { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
        .perm-time-end   { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }
        .perm-time-sep   { font-size:11px; color:#9ca3af; }

        /* ── Duration ── */
        .perm-duration-badge {
          display:inline-block; padding:2px 10px; border-radius:12px;
          background:#ede9fe; color:#6d28d9; font-size:12px; font-weight:600;
          border:1px solid #ddd6fe;
        }

        /* ── Reason ── */
        .perm-reason {
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
          overflow:hidden; font-size:13px; max-width:220px;
        }

        /* ── Status badge ── */
        .perm-status-badge {
          display:inline-block; padding:3px 10px; border-radius:20px;
          font-size:12px; font-weight:600; white-space:nowrap;
        }

        /* ── Modal overlay ── */
        .perm-modal-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.45);
          display:flex; align-items:center; justify-content:center;
          z-index:1000; padding:16px;
        }
        .perm-modal {
          background:#fff; border-radius:12px; width:100%; max-width:640px;
          max-height:90vh; display:flex; flex-direction:column;
          box-shadow:0 20px 60px rgba(0,0,0,0.2);
        }
        .perm-modal-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:18px 24px; border-bottom:1px solid #e2e8f0;
        }
        .perm-modal-header h3 { font-size:17px; font-weight:700; color:#1e293b; margin:0; }
        .perm-modal-close {
          background:none; border:none; cursor:pointer; color:#94a3b8; font-size:16px;
          padding:4px; border-radius:4px; transition:color 0.15s;
        }
        .perm-modal-close:hover { color:#dc2626; }
        .perm-modal-body { padding:24px; overflow-y:auto; flex:1; }
        .perm-modal-footer {
          display:flex; justify-content:flex-end; gap:10px;
          padding:16px 24px; border-top:1px solid #e2e8f0;
        }

        /* ── Form grid ── */
        .perm-form-grid {
          display:grid; grid-template-columns:1fr 1fr; gap:16px;
        }
        .perm-form-field { display:flex; flex-direction:column; gap:5px; }
        .perm-form-field-full { grid-column:1/-1; }
        .perm-form-field label { font-size:13px; font-weight:600; color:#374151; }
        .perm-form-field input,
        .perm-form-field select,
        .perm-form-field textarea {
          border:1px solid #d1d5db; border-radius:6px; padding:8px 10px;
          font-size:13.5px; color:#1e293b; background:#fff; outline:none;
          transition:border-color 0.15s;
        }
        .perm-form-field input:focus,
        .perm-form-field select:focus,
        .perm-form-field textarea:focus { border-color:#0b91ac; box-shadow:0 0 0 2px rgba(11,145,172,0.12); }
        .perm-form-field textarea { resize:vertical; }
        .input-error { border-color:#dc2626 !important; }
        .field-error  { font-size:11.5px; color:#dc2626; }
        .req { color:#dc2626; }

        /* ── Misc ── */
        .btn-outline {
          background:#fff; border:1px solid #d1d5db; color:#374151;
          padding:8px 18px; border-radius:6px; font-size:13.5px; font-weight:500;
          cursor:pointer; transition:background 0.15s;
        }
        .btn-outline:hover { background:#f9fafb; }

        @media (max-width:540px) {
          .perm-form-grid { grid-template-columns:1fr; }
          .perm-form-field-full { grid-column:1; }
        }
      `}</style>

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
    </main>
  );
};

export default PermissionList;