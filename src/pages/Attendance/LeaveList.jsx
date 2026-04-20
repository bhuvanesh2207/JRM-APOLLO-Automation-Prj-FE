import React, { useEffect, useState, useRef } from "react";
import { FaCalendarPlus, FaList, FaEdit, FaTrashAlt, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaTimes, FaClock, FaCheckCircle, FaTimesCircle, FaEye } from "react-icons/fa";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const TIMEZONE = import.meta.env.VITE_TIMEZONE;

/* ── Helpers ── */
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const LEAVE_TYPES = {
  ANNUAL: { label: "Annual Leave", color: "#3b82f6", bg: "#dbeafe" },
  SICK: { label: "Sick Leave", color: "#ef4444", bg: "#fee2e2" },
  CASUAL: { label: "Casual Leave", color: "#10b981", bg: "#d1fae5" },
  UNPAID: { label: "Unpaid Leave", color: "#6b7280", bg: "#f3f4f6" },
  OTHER: { label: "Other", color: "#8b5cf6", bg: "#ede9fe" }
};

const STATUS_META = {
  PENDING:  { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Pending" },
  APPROVED: { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", label: "Approved" },
  REJECTED: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Rejected" },
  CANCELLED: { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", label: "Cancelled" },
};

const EMPTY_FORM = {
  employee: "",
  leave_type: "ANNUAL",
  start_date: "",
  end_date: "",
  reason: "",
};

/* ════════════════════════════════════════════════════════════ */
const LeaveList = () => {
  /* ── Date nav state ── */
  const today = new Date();
  const [navYear,  setNavYear]  = useState(today.getFullYear());
  const [navMonth, setNavMonth] = useState(today.getMonth() + 1);

  /* ── Data ── */
  const [leaves,    setLeaves]    = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

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

  /* ── Review Modal ── */
  const [reviewModal, setReviewModal] = useState({ open: false, leave: null });
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [reviewing, setReviewing] = useState(false);

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

  /* ── Check if user is admin ── */
  const [isAdmin, setIsAdmin] = useState(false);

  /* ── Fetch leaves ── */
  const fetchLeaves = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/attendance/leaves/", {
        params: { year: navYear, month: navMonth },
      });
      if (res.data.success) {
        setLeaves(res.data.leaves || []);
      } else {
        setError("Failed to fetch leaves.");
      }
    } catch (err) {
      setError("Server error while fetching leaves.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch employees (admin only) ── */
  const fetchEmployees = async () => {
    try {
      const res = await api.get("/api/employees/list/");
      if (res.data.success) setEmployees(res.data.employees || []);
    } catch { /* silent */ }
  };

  /* ── Fetch stats ── */
  const fetchStats = async () => {
    try {
      const res = await api.get("/api/attendance/leaves/stats/");
      if (res.data.success) setStats(res.data.stats);
    } catch { /* silent */ }
  };

  /* ── Check admin status ── */
  const checkAdminStatus = async () => {
    try {
      const res = await api.get("/api/users/me/");
      setIsAdmin(res.data?.is_superuser || false);
    } catch { /* silent */ }
  };

  useEffect(() => { 
    checkAdminStatus();
    fetchLeaves(); 
    fetchStats();
  }, [navYear, navMonth]);
  
  useEffect(() => { 
    if (isAdmin) fetchEmployees(); 
  }, [isAdmin]);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const h = (e) => {
      if (entRef.current    && !entRef.current.contains(e.target)) setShowEntDrop(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setShowStatusDrop(false);
      if (typeRef.current   && !typeRef.current.contains(e.target)) setShowTypeDrop(false);
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

  /* ── Calculate days between dates ── */
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  /* ── Form change ── */
  const handleFormChange = (field, val) => {
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      // Auto-calculate days
      if ((field === "start_date" || field === "end_date") && next.start_date && next.end_date) {
        const days = calculateDays(next.start_date, next.end_date);
        if (days > 0) {
          // Could store days in form if needed
        }
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

  /* ── Open view modal ── */
  const openView = (leave) => {
    setModal({ open: true, mode: "view", data: leave });
    setForm({
      employee: leave.employee?.id || leave.employee,
      leave_type: leave.leave_type,
      start_date: leave.start_date,
      end_date: leave.end_date,
      reason: leave.reason,
    });
  };

  const closeModal = () => setModal({ open: false, mode: "add", data: null });

  /* ── Validate ── */
  const validate = () => {
    const errs = {};
    if (isAdmin && !form.employee) errs.employee = "Employee is required.";
    if (!form.leave_type) errs.leave_type = "Leave type is required.";
    if (!form.start_date) errs.start_date = "Start date is required.";
    if (!form.end_date) errs.end_date = "End date is required.";
    if (!form.reason.trim()) errs.reason = "Reason is required.";
    
    if (form.start_date && form.end_date) {
      const start = new Date(form.start_date);
      const end = new Date(form.end_date);
      if (start > end) errs.end_date = "End date must be after start date.";
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) errs.start_date = "Start date cannot be in the past.";
    }
    
    return errs;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        employee_id: isAdmin ? form.employee : undefined,
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason,
      };

      await api.post("/api/attendance/leaves/request/", payload);
      openPopup({ 
        type: "success", 
        title: "Success", 
        message: "Leave request submitted successfully. Administrators have been notified via email." 
      });
      closeModal();
      fetchLeaves();
      fetchStats();
    } catch (err) {
      const msg = err?.response?.data?.errors
        ? JSON.stringify(err.response.data.errors)
        : err?.response?.data?.message || "Server error. Please try again.";
      openPopup({ type: "error", title: "Error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  /* ── Cancel Leave ── */
  const handleCancel = (leave) => {
    openPopup({
      type: "delete", 
      title: "Cancel Leave Request",
      message: `Cancel leave request for ${leave.start_date} to ${leave.end_date}?`,
      showCancel: true, 
      confirmText: "Yes, Cancel", 
      cancelText: "Keep",
      onConfirm: async () => {
        closePopup();
        try {
          await api.delete(`/api/attendance/leaves/${leave.id}/cancel/`);
          fetchLeaves();
          fetchStats();
          openPopup({ type: "success", title: "Done", message: "Leave request cancelled." });
        } catch (err) {
          openPopup({ 
            type: "error", 
            title: "Error", 
            message: err?.response?.data?.message || "Failed to cancel leave." 
          });
        }
      },
    });
  };

  /* ── Open Review Modal ── */
  const openReview = (leave) => {
    setReviewModal({ open: true, leave });
    setReviewRemarks("");
  };

  /* ── Handle Review (Approve/Reject) ── */
  const handleReview = async (status) => {
    if (!reviewModal.leave) return;
    
    setReviewing(true);
    try {
      await api.post(`/api/attendance/leaves/${reviewModal.leave.id}/review/`, {
        status,
        admin_remarks: reviewRemarks
      });
      
      openPopup({ 
        type: "success", 
        title: "Success", 
        message: `Leave ${status.toLowerCase()} successfully. Employee has been notified via email.` 
      });
      setReviewModal({ open: false, leave: null });
      fetchLeaves();
      fetchStats();
    } catch (err) {
      openPopup({ 
        type: "error", 
        title: "Error", 
        message: err?.response?.data?.message || `Failed to ${status.toLowerCase()} leave.` 
      });
    } finally {
      setReviewing(false);
    }
  };

  /* ── Delete Leave (Admin only) ── */
  const handleDelete = (leave) => {
    openPopup({
      type: "delete", 
      title: "Delete Leave Record",
      message: `Permanently delete leave record for ${leave.employee_name}?`,
      showCancel: true, 
      confirmText: "Delete", 
      cancelText: "Cancel",
      onConfirm: async () => {
        closePopup();
        try {
          await api.delete(`/api/attendance/leaves/${leave.id}/delete/`);
          fetchLeaves();
          fetchStats();
          openPopup({ type: "success", title: "Done", message: "Leave record deleted." });
        } catch {
          openPopup({ type: "error", title: "Error", message: "Failed to delete leave record." });
        }
      },
    });
  };

  /* ── Filter / Paginate ── */
  const filtered = leaves.filter((l) => {
    const t = search.toLowerCase();
    const matchSearch = !t ||
      l.employee_name?.toLowerCase().includes(t) ||
      l.employee_id?.toLowerCase().includes(t) ||
      l.reason?.toLowerCase().includes(t);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchType = typeFilter === "all" || l.leave_type === typeFilter;
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

          {/* ── Header with Stats ── */}
          <div className="table-header">
            <h2><FaCalendarPlus className="domain-icon" /> Leave Management</h2>
          </div>

          {/* ── Stats Cards ── */}
          {stats && (
            <div className="leave-stats-grid">
              <div className="leave-stat-card" style={{ borderLeftColor: "#3b82f6" }}>
                <div className="stat-label">Total Approved</div>
                <div className="stat-value">{stats.total_approved}</div>
                <div className="stat-sub">Requests this year</div>
              </div>
              <div className="leave-stat-card" style={{ borderLeftColor: "#d97706" }}>
                <div className="stat-label">Pending</div>
                <div className="stat-value">{stats.total_pending}</div>
                <div className="stat-sub">Awaiting review</div>
              </div>
              <div className="leave-stat-card" style={{ borderLeftColor: "#dc2626" }}>
                <div className="stat-label">Rejected</div>
                <div className="stat-value">{stats.total_rejected}</div>
                <div className="stat-sub">This year</div>
              </div>
              <div className="leave-stat-card" style={{ borderLeftColor: "#10b981" }}>
                <div className="stat-label">Days Used</div>
                <div className="stat-value">{stats.total_days_used}</div>
                <div className="stat-sub">In {stats.year}</div>
              </div>
            </div>
          )}

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
                    placeholder="Search leaves" aria-label="Search leaves"
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
                      {Object.entries(LEAVE_TYPES).map(([key, val]) => (
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
                      {["PENDING","APPROVED","REJECTED","CANCELLED"].map((s) => (
                        <button key={s} type="button" className="sort-filter-option"
                          onClick={() => { setStatusFilter(s); setCurrentPage(1); setShowStatusDrop(false); }}>
                          <span className={`sort-filter-checkbox${statusFilter === s ? " checked" : ""}`} />
                          <span>{STATUS_META[s]?.label || s}</span>
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
            <div className="no-data">Loading leaves...</div>
          ) : error ? (
            <div style={{ color:"var(--error)" }}>{error}</div>
          ) : totalEntries === 0 ? (
            <div className="no-data">No leave requests found for {MONTH_NAMES[navMonth - 1]} {navYear}.</div>
          ) : (
            <>
              <div className="table-responsive">
                <table id="leavesTable">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Duration</th>
                      <th>Days</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((leave) => {
                      const sm = STATUS_META[leave.status] || STATUS_META.PENDING;
                      const tm = LEAVE_TYPES[leave.leave_type] || LEAVE_TYPES.OTHER;
                      const days = calculateDays(leave.start_date, leave.end_date);
                      
                      return (
                        <tr key={leave.id}>
                          <td data-label="Employee">
                            <strong>{leave.employee_name || `Emp #${leave.employee}`}</strong>
                            {leave.employee_id && (
                              <div className="text-sm text-gray">ID: {leave.employee_id}</div>
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

                          <td data-label="Duration">
                            <div style={{ fontSize: "13px" }}>
                              <div>
  {new Date(leave.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} 
  {" to "} 
  {new Date(leave.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
</div>
                            </div>
                          </td>

                          <td data-label="Days">
                            <span className="leave-days-badge">{days} day{days !== 1 ? 's' : ''}</span>
                          </td>

                          <td data-label="Status">
                            <span className="leave-status-badge" style={{
                              color: sm.color, background: sm.bg, border: `1px solid ${sm.border}`,
                            }}>
                              {sm.label}
                            </span>
                          </td>
                          <td data-label="Actions">
                            <div className="actions">
                              <button className="action-btn view-btn" onClick={() => openView(leave)} title="View">
                                <FaEye />
                              </button>
                              
                              {leave.status === "PENDING" && (
                                <>
                                  {isAdmin && (
                                    <>
                                      <button className="action-btn approve-btn" onClick={() => openReview(leave)} title="Review">
                                        <FaCheckCircle />
                                      </button>
                                    </>
                                  )}
                                  <button className="action-btn delete-btn" onClick={() => handleCancel(leave)} title="Cancel">
                                    <FaTimesCircle />
                                  </button>
                                </>
                              )}
                              
                              {isAdmin && leave.status !== "PENDING" && (
                                <button className="action-btn delete-btn" onClick={() => handleDelete(leave)} title="Delete">
                                  <FaTrashAlt />
                                </button>
                              )}
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

      {/* ════════════════ Request Leave Modal ════════════════ */}
      {modal.open && (modal.mode === "add" || modal.mode === "view") && (
        <div className="leave-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="leave-modal">
            <div className="leave-modal-header">
              <h3>{modal.mode === "add" ? "Request Leave" : "Leave Details"}</h3>
              <button className="leave-modal-close" onClick={closeModal}><FaTimes /></button>
            </div>

            <div className="leave-modal-body">
              <div className="leave-form-grid">
                {/* Employee (Admin only) */}
                {isAdmin && modal.mode === "add" && (
                  <div className="leave-form-field">
                    <label>Employee <span className="req">*</span></label>
                    <select
                      value={form.employee}
                      onChange={(e) => handleFormChange("employee", e.target.value)}
                      className={formErrors.employee ? "input-error" : ""}
                      disabled={modal.mode === "view"}
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
                )}

                {/* Leave Type */}
                <div className="leave-form-field">
                  <label>Leave Type <span className="req">*</span></label>
                  <select
                    value={form.leave_type}
                    onChange={(e) => handleFormChange("leave_type", e.target.value)}
                    disabled={modal.mode === "view"}
                  >
                    {Object.entries(LEAVE_TYPES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                  {formErrors.leave_type && <span className="field-error">{formErrors.leave_type}</span>}
                </div>

                {/* Start Date */}
                <div className="leave-form-field">
                  <label>Start Date <span className="req">*</span></label>
                  <input 
                    type="date" 
                    value={form.start_date}
                    onChange={(e) => handleFormChange("start_date", e.target.value)}
                    className={formErrors.start_date ? "input-error" : ""}
                    disabled={modal.mode === "view"}
                  />
                  {formErrors.start_date && <span className="field-error">{formErrors.start_date}</span>}
                </div>

                {/* End Date */}
                <div className="leave-form-field">
                  <label>End Date <span className="req">*</span></label>
                  <input 
                    type="date" 
                    value={form.end_date}
                    onChange={(e) => handleFormChange("end_date", e.target.value)}
                    className={formErrors.end_date ? "input-error" : ""}
                    disabled={modal.mode === "view"}
                  />
                  {formErrors.end_date && <span className="field-error">{formErrors.end_date}</span>}
                </div>

                {/* Days Display */}
                {form.start_date && form.end_date && (
                  <div className="leave-form-field">
                    <label>Total Days</label>
                    <div className="leave-days-display">
                      {calculateDays(form.start_date, form.end_date)} day(s)
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div className="leave-form-field leave-form-field-full">
                  <label>Reason <span className="req">*</span></label>
                  <textarea 
                    rows={4} 
                    value={form.reason}
                    onChange={(e) => handleFormChange("reason", e.target.value)}
                    placeholder="Enter reason for leave..."
                    className={formErrors.reason ? "input-error" : ""}
                    disabled={modal.mode === "view"}
                  />
                  {formErrors.reason && <span className="field-error">{formErrors.reason}</span>}
                </div>

                {/* Info Note */}
                {modal.mode === "add" && (
                  <div className="leave-form-field leave-form-field-full">
                    <div className="leave-info-note">
                      <strong>Note:</strong> Submitting this request will notify all administrators via email with Approve/Reject options.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="leave-modal-footer">
              <button type="button" className="btn btn-outline" onClick={closeModal}>
                {modal.mode === "view" ? "Close" : "Cancel"}
              </button>
              {modal.mode === "add" && (
                <button type="button" className="btn btn-secondary" onClick={handleSubmit} disabled={saving}>
                  {saving ? "Submitting..." : "Submit Request"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ Review Modal (Admin) ════════════════ */}
      {reviewModal.open && reviewModal.leave && (
        <div className="leave-modal-overlay" onClick={() => setReviewModal({ open: false, leave: null })}>
          <div className="leave-modal" style={{ maxWidth: "500px" }}>
            <div className="leave-modal-header">
              <h3>Review Leave Request</h3>
              <button className="leave-modal-close" onClick={() => setReviewModal({ open: false, leave: null })}>
                <FaTimes />
              </button>
            </div>

            <div className="leave-modal-body">
              <div style={{ marginBottom: "20px" }}>
                <div style={{ marginBottom: "12px" }}>
                  <strong>Employee:</strong> {reviewModal.leave.employee_name}
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <strong>Duration:</strong> {reviewModal.leave.start_date} to {reviewModal.leave.end_date} 
                  ({calculateDays(reviewModal.leave.start_date, reviewModal.leave.end_date)} days)
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <strong>Type:</strong> {LEAVE_TYPES[reviewModal.leave.leave_type]?.label}
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <strong>Reason:</strong>
                  <div style={{ 
                    background: "#f8f9fa", 
                    padding: "12px", 
                    borderRadius: "8px",
                    marginTop: "8px",
                    fontSize: "14px"
                  }}>
                    {reviewModal.leave.reason}
                  </div>
                </div>
              </div>

              <div className="leave-form-field">
                <label>Admin Remarks (Optional)</label>
                <textarea
                  rows={3}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Add any remarks for the employee..."
                />
              </div>
            </div>

            <div className="leave-modal-footer" style={{ justifyContent: "space-between" }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setReviewModal({ open: false, leave: null })}
                disabled={reviewing}
              >
                Cancel
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={() => handleReview("REJECTED")}
                  disabled={reviewing}
                  style={{ background: "#dc2626", color: "white", border: "none" }}
                >
                  Reject
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={() => handleReview("APPROVED")}
                  disabled={reviewing}
                  style={{ background: "#15803d", color: "white", border: "none" }}
                >
                  {reviewing ? "Processing..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── Stats Cards ── */
        .leave-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .leave-stat-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-left: 4px solid;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .stat-label {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.2;
        }
        .stat-sub {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
        }

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

        /* ── Days Badge ── */
        .leave-days-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          background: #ede9fe;
          color: #6d28d9;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid #ddd6fe;
        }

        /* ── Reason ── */
        .leave-reason {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 13px;
          max-width: 200px;
        }

        /* ── Status badge ── */
        .leave-status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        /* ── Modal ── */
        .leave-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 16px;
        }
        .leave-modal {
          background: #fff; border-radius: 12px; width: 100%; max-width: 600px;
          max-height: 90vh; display: flex; flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .leave-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px; border-bottom: 1px solid #e2e8f0;
        }
        .leave-modal-header h3 { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0; }
        .leave-modal-close {
          background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 16px;
          padding: 4px; border-radius: 4px; transition: color 0.15s;
        }
        .leave-modal-close:hover { color: #dc2626; }
        .leave-modal-body { padding: 24px; overflow-y: auto; flex: 1; }
        .leave-modal-footer {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 24px; border-top: 1px solid #e2e8f0;
        }

        /* ── Form ── */
        .leave-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        .leave-form-field { display: flex; flex-direction: column; gap: 5px; }
        .leave-form-field-full { grid-column: 1/-1; }
        .leave-form-field label { font-size: 13px; font-weight: 600; color: #374151; }
        .leave-form-field input,
        .leave-form-field select,
        .leave-form-field textarea {
          border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 10px;
          font-size: 13.5px; color: #1e293b; background: #fff; outline: none;
          transition: border-color 0.15s;
        }
        .leave-form-field input:focus,
        .leave-form-field select:focus,
        .leave-form-field textarea:focus { 
          border-color: #0b91ac; 
          box-shadow: 0 0 0 2px rgba(11,145,172,0.12); 
        }
        .leave-form-field textarea { resize: vertical; }
        .leave-form-field input:disabled,
        .leave-form-field select:disabled,
        .leave-form-field textarea:disabled {
          background: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
        }
        .input-error { border-color: #dc2626 !important; }
        .field-error { font-size: 11.5px; color: #dc2626; }
        .req { color: #dc2626; }

        .leave-days-display {
          padding: 8px 10px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }

        .leave-info-note {
          background: #e0f2fe;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }

        /* ── Action Buttons ── */
        .view-btn { color: #3b82f6; }
        .approve-btn { color: #15803d; }

        .btn-danger {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 6px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-danger:hover { background: #b91c1c; }
        .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-success {
          background: #15803d;
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 6px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-success:hover { background: #166534; }
        .btn-success:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .leave-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 540px) {
          .leave-stats-grid {
            grid-template-columns: 1fr;
          }
          .leave-form-grid { grid-template-columns: 1fr; }
          .leave-form-field-full { grid-column: 1; }
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

export default LeaveList;