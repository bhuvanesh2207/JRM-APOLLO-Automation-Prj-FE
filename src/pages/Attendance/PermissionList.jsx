import React, { useEffect, useState, useRef } from "react";
import { FaClipboardList, FaPlus, FaEdit, FaTrashAlt, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaTimes, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
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
  return `${h12}:${h12 < 10 ? '0' : ''}${h12}:${m} ${ampm}`;
};

const formatDateTime = (dt) => {
  if (!dt) return "—";
  const date = new Date(dt);
  return date.toLocaleString("en-IN", { 
    timeZone: TIMEZONE,
    day: "2-digit", 
    month: "short", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const PERMISSION_TYPES = {
  END_DAY: { label: "End of Day", color: "#f59e0b", bg: "#fef3c7" },
  MID_DAY: { label: "Mid Day", color: "#3b82f6", bg: "#dbeafe" }
};

const STATUS_META = {
  ACTIVE:    { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Active" },
  COMPLETED: { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", label: "Completed" },
  EXPIRED:   { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", label: "Expired" },
  CANCELLED: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Cancelled" },
  PENDING:   { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Pending" },
  APPROVED:  { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", label: "Approved" },
  REJECTED:  { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Rejected" },
};

const EMPTY_FORM = {
  employee:   "",
  permission_type: "END_DAY",
  date:       "",
  start_time: "",
  expected_end_time: "",
  reason:     "",
};

/* ════════════════════════════════════════════════════════════ */
const PermissionList = () => {
  /* ── Date nav state (month picker) ── */
  const today = new Date();
  const [navYear,  setNavYear]  = useState(today.getFullYear());
  const [navMonth, setNavMonth] = useState(today.getMonth() + 1);

  /* ── Data ── */
  const [permissions, setPermissions] = useState([]);
  const [employees,   setEmployees]   = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  /* ── Table controls ── */
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [typeFilter,     setTypeFilter]     = useState("all");
  const [entriesPerPage, setEntries]        = useState(10);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [showEntDrop,    setShowEntDrop]    = useState(false);
  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [showTypeDrop,   setShowTypeDrop]   = useState(false);

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
  const typeRef   = useRef(null);

  /* ── Fetch permissions for selected month ── */
  const fetchPermissions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/attendance/employee-permissions/", {
        params: { year: navYear, month: navMonth },
      });
      if (res.data.success) {
        setPermissions(res.data.permissions || []);
      } else {
        setError("Failed to fetch permissions.");
      }
    } catch (err) {
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
      if (typeRef.current   && !typeRef.current.contains(e.target))   setShowTypeDrop(false);
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

  /* ── Form change ── */
  const handleFormChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setFormErrors((e) => ({ ...e, [field]: "" }));
  };

  /* ── Open add modal ── */
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModal({ open: true, mode: "add", data: null });
  };

  /* ── Open edit modal (for admin status updates) ── */
  const openEdit = (perm) => {
    setForm({
      employee:   perm.employee?.id || perm.employee || "",
      permission_type: perm.permission_type || "END_DAY",
      date:       perm.date || "",
      start_time: perm.start_time?.slice(0, 5) || "",
      expected_end_time: perm.expected_end_time?.slice(0, 5) || "",
      reason:     perm.reason || "",
    });
    setFormErrors({});
    setModal({ open: true, mode: "edit", data: perm });
  };

  const closeModal = () => setModal({ open: false, mode: "add", data: null });

  /* ── Validate ── */
  const validate = () => {
    const errs = {};
    if (!form.employee)         errs.employee   = "Employee is required.";
    if (!form.date)             errs.date       = "Date is required.";
    if (!form.start_time)       errs.start_time = "Start time is required.";
    if (!form.expected_end_time) errs.expected_end_time = "Expected end time is required.";
    if (!form.reason.trim())    errs.reason     = "Reason is required.";
    if (form.start_time && form.expected_end_time && form.start_time >= form.expected_end_time)
      errs.expected_end_time = "End time must be after start time.";
    return errs;
  };

  /* ── Submit (Create new permission request) ── */
  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        employee_id: form.employee,
        permission_type: form.permission_type,
        date: form.date,
        start_time: form.start_time,
        expected_end_time: form.expected_end_time,
        reason: form.reason,
      };

      if (modal.mode === "add") {
        await api.post("/api/attendance/employee-permissions/request/", payload);
        openPopup({ type: "success", title: "Done", message: "Permission request submitted successfully. Admins have been notified." });
      } else {
        // For edit, we might only update status (admin only)
        await api.put(`/api/attendance/employee-permissions/${modal.data.id}/edit/`, payload);
        openPopup({ type: "success", title: "Done", message: "Permission updated successfully." });
      }
      closeModal();
      fetchPermissions();
    } catch (err) {
      const msg = err?.response?.data?.errors
        ? JSON.stringify(err.response.data.errors)
        : err?.response?.data?.message || "Server error. Please try again.";
      openPopup({ type: "error", title: "Error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  /* ── Cancel Permission ── */
  const handleCancel = (perm) => {
    openPopup({
      type: "delete", title: "Cancel Permission",
      message: `Cancel permission for "${perm.employee_name || "this employee"}" on ${perm.date}?`,
      showCancel: true, confirmText: "Cancel Permission", cancelText: "Keep",
      onConfirm: async () => {
        closePopup();
        try {
          await api.delete(`/api/attendance/employee-permissions/${perm.id}/cancel/`);
          fetchPermissions();
          openPopup({ type: "success", title: "Done", message: "Permission cancelled." });
        } catch (err) {
          openPopup({ type: "error", title: "Error", message: err?.response?.data?.message || "Failed to cancel permission." });
        }
      },
    });
  };

  /* ── Delete (Hard delete - admin only) ── */
  const handleDelete = (perm) => {
    openPopup({
      type: "delete", title: "Delete Permission",
      message: `Permanently delete permission for "${perm.employee_name || "this employee"}" on ${perm.date}?`,
      showCancel: true, confirmText: "Delete", cancelText: "Cancel",
      onConfirm: async () => {
        closePopup();
        try {
          await api.delete(`/api/attendance/employee-permissions/${perm.id}/delete/`);
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
      p.employee_id?.toLowerCase().includes(t) ||
      p.reason?.toLowerCase().includes(t);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchType = typeFilter === "all" || p.permission_type === typeFilter;
    return matchSearch && matchStatus && matchType;
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

              <div className="table-controls-right">
                <div className="table-search">
                  <input
                    type="text" value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    placeholder="Search permissions" aria-label="Search permissions"
                  />
                </div>
                
                {/* Type Filter */}
                <div className="sort-filter-wrapper" ref={typeRef}>
                  <button type="button" className="btn btn-sort" onClick={() => setShowTypeDrop((v) => !v)}>
                    <span>Type</span>
                    <span className="sort-filter-caret" />
                  </button>
                  {showTypeDrop && (
                    <div className="sort-filter-dropdown">
                      {Object.entries(PERMISSION_TYPES).map(([key, val]) => (
                        <button key={key} type="button" className="sort-filter-option"
                          onClick={() => { setTypeFilter(key); setCurrentPage(1); setShowTypeDrop(false); }}>
                          <span className={`sort-filter-checkbox${typeFilter === key ? " checked" : ""}`} />
                          <span>{val.label}</span>
                        </button>
                      ))}
                      <div className="sort-filter-divider" />
                      <button type="button" className="sort-filter-option"
                        onClick={() => { setTypeFilter("all"); setCurrentPage(1); setShowTypeDrop(false); }}>
                        <span className={`sort-filter-checkbox${typeFilter === "all" ? " checked" : ""}`} />
                        <span>All Types</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Filter */}
                <div className="sort-filter-wrapper" ref={statusRef}>
                  <button type="button" className="btn btn-sort" onClick={() => setShowStatusDrop((v) => !v)}>
                    <span>Status</span>
                    <span className="sort-filter-caret" />
                  </button>
                  {showStatusDrop && (
                    <div className="sort-filter-dropdown">
                      {["ACTIVE","COMPLETED","EXPIRED","CANCELLED"].map((s) => (
                        <button key={s} type="button" className="sort-filter-option"
                          onClick={() => { setStatusFilter(s); setCurrentPage(1); setShowStatusDrop(false); }}>
                          <span className={`sort-filter-checkbox${statusFilter === s ? " checked" : ""}`} />
                          <span style={{ textTransform:"capitalize" }}>{STATUS_META[s]?.label || s}</span>
                        </button>
                      ))}
                      <div className="sort-filter-divider" />
                      <button type="button" className="sort-filter-option"
                        onClick={() => { setStatusFilter("all"); setCurrentPage(1); setShowStatusDrop(false); }}>
                        <span className={`sort-filter-checkbox${statusFilter === "all" ? " checked" : ""}`} />
                        <span>All Statuses</span>
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
                      <th>Type</th>
                      <th>Date</th>
                      <th>Departed</th>
                      <th>Expected Return</th>
                      <th>Actual Return</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((perm) => {
                      const sm = STATUS_META[perm.status] || STATUS_META.PENDING;
                      const tm = PERMISSION_TYPES[perm.permission_type] || PERMISSION_TYPES.END_DAY;
                      
                      return (
                        <tr key={perm.id}>
                          <td data-label="Employee">
                            <strong>{perm.employee_name || `Emp #${perm.employee}`}</strong>
                            {perm.employee_id && (
                              <div className="text-sm text-gray">ID: {perm.employee_id}</div>
                            )}
                          </td>

                          <td data-label="Type">
                            <span style={{
                              background: tm.bg, color: tm.color,
                              padding: "3px 10px", borderRadius: "20px",
                              fontSize: "12px", fontWeight: 600
                            }}>
                              {tm.label}
                            </span>
                          </td>

                          <td data-label="Date">
                            {perm.date
                              ? new Date(perm.date).toLocaleDateString("en-IN", { timeZone: TIMEZONE, day:"2-digit", month:"short", year:"numeric" })
                              : "N/A"}
                          </td>

                          <td data-label="Departed">
                            {perm.start_time && (
                              <span className="perm-time-tag perm-time-start">
                                <FaClock style={{ fontSize:9 }} /> {formatDateTime(perm.start_time)}
                              </span>
                            )}
                          </td>

                          <td data-label="Expected Return">
                            {perm.expected_end_time && (
                              <span className="perm-time-tag perm-time-end">
                                <FaClock style={{ fontSize:9 }} /> {formatDateTime(perm.expected_end_time)}
                              </span>
                            )}
                          </td>

                          <td data-label="Actual Return">
                            {perm.actual_end_time ? (
                              <span className="perm-time-tag" style={{ background:"#e0f2fe", color:"#0369a1", border:"1px solid #bae6fd" }}>
                                <FaCheckCircle style={{ fontSize:9 }} /> {formatDateTime(perm.actual_end_time)}
                              </span>
                            ) : (
                              <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>
                            )}
                          </td>

                          <td data-label="Reason">
                            <span className="perm-reason" title={perm.reason}>{perm.reason}</span>
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
              <h3>{modal.mode === "add" ? "Request Permission" : "Edit Permission"}</h3>
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

                {/* Permission Type */}
                <div className="perm-form-field">
                  <label>Permission Type <span className="req">*</span></label>
                  <select
                    value={form.permission_type}
                    onChange={(e) => handleFormChange("permission_type", e.target.value)}
                  >
                    <option value="END_DAY">End of Day</option>
                    <option value="MID_DAY">Mid Day (Return Expected)</option>
                  </select>
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

                {/* Departure Time */}
                <div className="perm-form-field">
                  <label>Departure Time <span className="req">*</span></label>
                  <input type="datetime-local" value={form.start_time}
                    onChange={(e) => handleFormChange("start_time", e.target.value)}
                    className={formErrors.start_time ? "input-error" : ""}
                  />
                  {formErrors.start_time && <span className="field-error">{formErrors.start_time}</span>}
                </div>

                {/* Expected Return Time */}
                <div className="perm-form-field">
                  <label>Expected Return <span className="req">*</span></label>
                  <input type="datetime-local" value={form.expected_end_time}
                    onChange={(e) => handleFormChange("expected_end_time", e.target.value)}
                    className={formErrors.expected_end_time ? "input-error" : ""}
                  />
                  {formErrors.expected_end_time && <span className="field-error">{formErrors.expected_end_time}</span>}
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

                {/* Info Note */}
                <div className="perm-form-field perm-form-field-full">
                  <div style={{ 
                    background: "#e0f2fe", padding: "12px", borderRadius: "8px",
                    fontSize: "13px", color: "#0369a1", border: "1px solid #bae6fd"
                  }}>
                    <strong>Note:</strong> Submitting this request will notify all administrators via email.
                    {form.permission_type === "MID_DAY" && " You must complete the permission by checking in from the office location upon return."}
                  </div>
                </div>

              </div>
            </div>

            <div className="perm-modal-footer">
              <button type="button" className="btn btn-outline" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleSubmit} disabled={saving}>
                {saving ? "Submitting..." : "Submit Request"}
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
        .perm-time-tag {
          display:inline-flex; align-items:center; gap:3px;
          font-size:11.5px; font-weight:500; padding:2px 7px;
          border-radius:10px; white-space:nowrap;
        }
        .perm-time-start { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
        .perm-time-end   { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }

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