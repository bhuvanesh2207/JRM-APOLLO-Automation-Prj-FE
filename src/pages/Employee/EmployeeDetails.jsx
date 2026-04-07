import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEdit, FaTrashAlt, FaList, FaUserPlus, FaEye, FaClock,
  FaUserClock, FaClipboardList, FaChevronLeft, FaChevronRight,
  FaTimes, FaCalendarAlt,
} from "react-icons/fa";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const TIMEZONE = import.meta.env.VITE_TIMEZONE;

/* ── Format 24h → 12h ── */
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
  pending:  { color:"#d97706", bg:"#fffbeb", border:"#fde68a", label:"Pending"  },
  approved: { color:"#15803d", bg:"#f0fdf4", border:"#bbf7d0", label:"Approved" },
  rejected: { color:"#dc2626", bg:"#fef2f2", border:"#fecaca", label:"Rejected" },
};

/* ════════════════════════════════════════════════════════════ */
const EmployeeDetails = () => {
  const navigate = useNavigate();

  /* ── Employees ── */
  const [employees,     setEmployees]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");

  /* ── Table controls ── */
  const [search,        setSearch]        = useState("");
  const [entriesPerPage, setEntries]      = useState(5);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [sortFilter,    setSortFilter]    = useState("all");
  const [showSortDrop,  setShowSortDrop]  = useState(false);
  const [showEntDrop,   setShowEntDrop]   = useState(false);

  /* ── Permissions drawer ── */
  const [drawer, setDrawer] = useState({ open: false, employee: null });
  const today = new Date();
  const [permYear,  setPermYear]  = useState(today.getFullYear());
  const [permMonth, setPermMonth] = useState(today.getMonth() + 1);
  const [perms,     setPerms]     = useState([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [permsError,   setPermsError]   = useState("");

  const sortRef = useRef(null);
  const entRef  = useRef(null);

  /* ── Popup ── */
  const [popupConfig, setPopupConfig] = useState({
    show: false, type: "info", title: "", message: "",
    confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null,
  });
  const openPopup  = (cfg) => setPopupConfig({ show:true, type:"info", title:"", message:"", confirmText:"OK", cancelText:"Cancel", showCancel:false, onConfirm:null, ...cfg });
  const closePopup = ()    => setPopupConfig((p) => ({ ...p, show:false }));

  /* ── Fetch employees ── */
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/employees/list/");
      if (res.data.success) {
        setEmployees(res.data.employees || []);
        setError("");
      } else {
        setError("Failed to fetch employees.");
      }
    } catch {
      setError("Server error while fetching employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const h = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDrop(false);
      if (entRef.current  && !entRef.current.contains(e.target))  setShowEntDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Fetch permissions for drawer ── */
  const fetchPermissions = async (employeeId, year, month) => {
    setPermsLoading(true);
    setPermsError("");
    try {
      const res = await api.get("/api/attendance/permissions/", {
        params: { employee: employeeId, year, month },
      });
      setPerms(res.data.permissions || res.data.results || res.data || []);
    } catch {
      setPermsError("Failed to fetch permissions.");
    } finally {
      setPermsLoading(false);
    }
  };

  /* ── Open drawer ── */
  const openPermDrawer = (emp) => {
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    setPermYear(y);
    setPermMonth(m);
    setDrawer({ open: true, employee: emp });
    fetchPermissions(emp.id, y, m);
  };

  const closeDrawer = () => {
    setDrawer({ open: false, employee: null });
    setPerms([]);
    setPermsError("");
  };

  /* ── Drawer month nav ── */
  const drawerPrevMonth = () => {
    let y = permYear, m = permMonth;
    if (m === 1) { y -= 1; m = 12; } else m -= 1;
    setPermYear(y); setPermMonth(m);
    fetchPermissions(drawer.employee.id, y, m);
  };
  const drawerNextMonth = () => {
    let y = permYear, m = permMonth;
    if (m === 12) { y += 1; m = 1; } else m += 1;
    setPermYear(y); setPermMonth(m);
    fetchPermissions(drawer.employee.id, y, m);
  };

  /* ── Soft delete employee ── */
  const handleDeleteEmployee = (id, name) => {
    openPopup({
      type:"delete", title:"Deactivate Employee",
      message:`Are you sure you want to deactivate "${name}"?`,
      showCancel:true, confirmText:"Deactivate", cancelText:"Cancel",
      onConfirm: async () => {
        closePopup();
        try {
          await api.delete(`/api/employees/delete/${id}/`);
          await fetchEmployees();
          openPopup({ type:"success", title:"Done", message:"Employee deactivated successfully." });
        } catch {
          openPopup({ type:"error", title:"Error", message:"Server error while deactivating employee." });
        }
      },
    });
  };

  /* ── Helpers ── */
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { timeZone: TIMEZONE, day:"2-digit", month:"short", year:"numeric" }) : "N/A";

  const designationLabel = (val) => {
    const map = {
      software_developer:"Software Developer",
      graphic_designer:  "Graphic Designer",
      web_designer:      "Web Designer",
      ui_ux_designer:    "UI/UX Designer",
      business_analyst:  "Business Analyst",
    };
    return map[val] || val || "N/A";
  };

  /* ── Filter options ── */
  const SORT_OPTIONS = [
    { value:"active",             label:"Active Employees"   },
    { value:"inactive",           label:"Inactive Employees" },
    { value:"software_developer", label:"Software Developer" },
    { value:"graphic_designer",   label:"Graphic Designer"   },
    { value:"web_designer",       label:"Web Designer"       },
    { value:"ui_ux_designer",     label:"UI/UX Designer"     },
    { value:"business_analyst",   label:"Business Analyst"   },
  ];

  const passesSortFilter = (emp, f) => {
    if (f === "all")      return true;
    if (f === "active")   return emp.status === "active";
    if (f === "inactive") return emp.status === "inactive";
    return emp.designation === f;
  };

  /* ── Pagination ── */
  const filtered = employees.filter((emp) => {
    if (search) {
      const t = search.toLowerCase();
      if (
        !emp.full_name?.toLowerCase().includes(t) &&
        !emp.employee_id?.toLowerCase().includes(t) &&
        !emp.email?.toLowerCase().includes(t) &&
        !emp.designation?.toLowerCase().includes(t)
      ) return false;
    }
    return passesSortFilter(emp, sortFilter);
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

          {/* Header */}
          <div className="table-header">
            <h2><FaList className="domain-icon" /> Employees</h2>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/employee/new")}>
              <FaUserPlus style={{ marginRight:4 }} /> Add Employee
            </button>
          </div>

          {/* Controls */}
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
                      {[5,10,25,50].map((n) => (
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
                  <input type="text" value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    placeholder="Search employees" aria-label="Search employees"
                  />
                </div>
                <div className="sort-filter-wrapper" ref={sortRef}>
                  <button type="button" className="btn btn-sort" onClick={() => setShowSortDrop((v) => !v)}>
                    <span>Filter</span>
                    <span className="sort-filter-caret" />
                  </button>
                  {showSortDrop && (
                    <div className="sort-filter-dropdown">
                      {SORT_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button" className="sort-filter-option"
                          onClick={() => { setSortFilter(opt.value); setCurrentPage(1); setShowSortDrop(false); }}>
                          <span className={`sort-filter-checkbox${sortFilter === opt.value ? " checked" : ""}`} />
                          <span>{opt.label}</span>
                        </button>
                      ))}
                      <div className="sort-filter-divider" />
                      <button type="button" className="sort-filter-option"
                        onClick={() => { setSortFilter("all"); setCurrentPage(1); setShowSortDrop(false); }}>
                        <span className={`sort-filter-checkbox${sortFilter === "all" ? " checked" : ""}`} />
                        <span>Clear</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="no-data">Loading employees...</div>
          ) : error ? (
            <div style={{ color:"var(--error)" }}>{error}</div>
          ) : totalEntries === 0 ? (
            <div className="no-data">No employees found.</div>
          ) : (
            <>
              <div className="table-responsive">
                <table id="employeesTable">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Designation</th>
                      <th>Contact</th>
                      <th>Date of Joining</th>
                      <th>Blood Group</th>
                      <th>Assigned Shift</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((emp) => {
                      const shift = emp.assigned_shift;
                      return (
                        <tr key={emp.id}>

                          {/* Employee */}
                          <td data-label="Employee">
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div>
                                <strong>{emp.full_name}</strong>
                                <div className="text-sm text-gray">ID: {emp.employee_id}</div>
                                <div className="text-sm text-gray">{emp.email}</div>
                              </div>
                            </div>
                          </td>

                          <td data-label="Designation">{designationLabel(emp.designation)}</td>

                          <td data-label="Contact">
                            <div>{emp.primary_contact_no || "N/A"}</div>
                            {emp.alt_contact_no && <div className="text-sm text-gray">Alt: {emp.alt_contact_no}</div>}
                          </td>

                          <td data-label="Date of Joining">{fmtDate(emp.date_of_joining)}</td>

                          <td data-label="Blood Group">
                            {emp.blood_group
                              ? <span className="blood-badge">{emp.blood_group}</span>
                              : "N/A"}
                          </td>

                          {/* Assigned Shift */}
                          <td data-label="Assigned Shift">
                            {shift ? (
                              <div className="shift-cell">
                                <span className="shift-name-badge">{shift.shift_name}</span>
                                <div className="shift-timings">
                                  <span className="shift-time shift-time-start">
                                    <FaClock className="shift-clock-icon" />{fmt12(shift.start_time)}
                                  </span>
                                  <span className="shift-time-sep">→</span>
                                  <span className="shift-time shift-time-end">
                                    <FaClock className="shift-clock-icon" />{fmt12(shift.end_time)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="shift-unassigned">Not assigned</span>
                            )}
                          </td>

                          <td data-label="Status"
                            className={emp.status === "active" ? "status-active" : "status-inactive"}>
                            {emp.status === "active" ? "Active" : "Inactive"}
                          </td>

                          {/* Actions */}
                          <td data-label="Actions">
                            <div className="actions">
                              <button className="action-btn view-btn"
                                onClick={() => navigate(`/employees/view/${emp.id}`)} title="View Details">
                                <FaEye />
                              </button>
                              <button className="action-btn edit-btn"
                                onClick={() => navigate(`/employees/edit/${emp.id}`)} title="Edit Employee">
                                <FaEdit />
                              </button>
                              <button className="action-btn shift-btn"
                                onClick={() => navigate(`/shifts/assign?employee=${emp.employee_id}`)} title="Assign / Edit Shift">
                                <FaUserClock />
                              </button>
                              {/* ── Permissions button (NEW) ── */}
                              <button className="action-btn perm-btn"
                                onClick={() => openPermDrawer(emp)} title="View Permissions">
                                <FaClipboardList />
                              </button>
                              <button className="action-btn delete-btn"
                                onClick={() => handleDeleteEmployee(emp.id, emp.full_name)} title="Deactivate">
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

              {/* Footer */}
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

      {/* ════════════════ Permissions Drawer ════════════════ */}
      {drawer.open && (
        <>
          <div className="drawer-backdrop" onClick={closeDrawer} />
          <div className="perm-drawer">
            {/* Drawer header */}
            <div className="perm-drawer-header">
              <div>
                <div className="perm-drawer-title">
                  <FaClipboardList style={{ color:"#0b91ac" }} />
                  Permissions
                </div>
                <div className="perm-drawer-sub">{drawer.employee?.full_name} · {drawer.employee?.employee_id}</div>
              </div>
              <button className="drawer-close-btn" onClick={closeDrawer}><FaTimes /></button>
            </div>

            {/* Month navigator */}
            <div className="drawer-month-nav">
              <button type="button" className="month-nav-btn" onClick={drawerPrevMonth}>
                <FaChevronLeft />
              </button>
              <div className="month-nav-label">
                <FaCalendarAlt className="month-nav-icon" />
                <span>{MONTH_NAMES[permMonth - 1]} {permYear}</span>
              </div>
              <button type="button" className="month-nav-btn" onClick={drawerNextMonth}>
                <FaChevronRight />
              </button>
            </div>

            {/* Permissions list */}
            <div className="perm-drawer-body">
              {permsLoading ? (
                <div className="drawer-empty">Loading...</div>
              ) : permsError ? (
                <div className="drawer-empty" style={{ color:"#dc2626" }}>{permsError}</div>
              ) : perms.length === 0 ? (
                <div className="drawer-empty">
                  No permissions for {MONTH_NAMES[permMonth - 1]} {permYear}.
                </div>
              ) : (
                perms.map((perm) => {
                  const sm = STATUS_META[perm.status] || STATUS_META.pending;
                  return (
                    <div key={perm.id} className="perm-drawer-card">
                      <div className="perm-card-top">
                        <span className="perm-card-date">
                          {perm.date
                            ? new Date(perm.date).toLocaleDateString("en-IN", { timeZone: TIMEZONE, day:"2-digit", month:"short", year:"numeric" })
                            : "N/A"}
                        </span>
                        <span className="perm-status-badge" style={{
                          color:sm.color, background:sm.bg, border:`1px solid ${sm.border}`,
                        }}>
                          {sm.label}
                        </span>
                      </div>

                      <div className="perm-card-times">
                        <span className="perm-time-tag perm-time-start">
                          <FaClock style={{ fontSize:9 }} /> {fmt12(perm.start_time)}
                        </span>
                        <span className="perm-time-sep">→</span>
                        <span className="perm-time-tag perm-time-end">
                          <FaClock style={{ fontSize:9 }} /> {fmt12(perm.end_time)}
                        </span>
                        {perm.duration && (
                          <span className="perm-duration-badge">{perm.duration} hrs</span>
                        )}
                      </div>

                      <div className="perm-card-reason">{perm.reason}</div>

                      {perm.approved_by_name && (
                        <div className="perm-card-approver">
                          Approved by: <strong>{perm.approved_by_name}</strong>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer summary */}
            {perms.length > 0 && (
              <div className="perm-drawer-footer">
                <span>{perms.length} permission{perms.length !== 1 ? "s" : ""} this month</span>
                <span className="perm-drawer-total-hrs">
                  Total:{" "}
                  {perms.reduce((acc, p) => acc + parseFloat(p.duration || 0), 0).toFixed(2)} hrs
                </span>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        /* ── Employee table badges ── */
        .blood-badge {
          display:inline-block; padding:2px 10px; border-radius:12px;
          background:#fee2e2; color:#dc2626; font-size:12px; font-weight:700;
        }
        .shift-cell { display:flex; flex-direction:column; gap:4px; }
        .shift-name-badge {
          display:inline-block; padding:3px 10px; border-radius:20px;
          background:#e0f7f9; color:#0b91ac; border:1px solid #b2ebf2;
          font-size:12px; font-weight:600; white-space:nowrap; width:fit-content;
        }
        .shift-timings { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
        .shift-time {
          display:inline-flex; align-items:center; gap:3px;
          font-size:11.5px; font-weight:500; padding:2px 7px;
          border-radius:10px; white-space:nowrap;
        }
        .shift-time-start { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
        .shift-time-end   { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }
        .shift-time-sep   { font-size:11px; color:#9ca3af; }
        .shift-clock-icon { font-size:9px; opacity:0.8; }
        .shift-unassigned { font-size:12px; color:#9ca3af; font-style:italic; }

        /* ── Action button colours ── */
        .action-btn.view-btn  { color:#0b91ac; }
        .action-btn.view-btn:hover  { background:rgba(96,165,179,0.1); }
        .action-btn.shift-btn { color:#7c3aed; }
        .action-btn.shift-btn:hover { background:rgba(124,58,237,0.1); }
        .action-btn.perm-btn  { color:#0891b2; }
        .action-btn.perm-btn:hover  { background:rgba(8,145,178,0.1); }

        /* ── Drawer ── */
        .drawer-backdrop {
          position:fixed; inset:0; background:rgba(0,0,0,0.3);
          z-index:900; backdrop-filter:blur(2px);
        }
        .perm-drawer {
          position:fixed; top:0; right:0; bottom:0; width:380px; max-width:100%;
          background:#fff; z-index:901; display:flex; flex-direction:column;
          box-shadow:-4px 0 32px rgba(0,0,0,0.15);
          animation: slideIn 0.22s ease;
        }
        @keyframes slideIn {
          from { transform:translateX(100%); }
          to   { transform:translateX(0); }
        }
        .perm-drawer-header {
          display:flex; align-items:flex-start; justify-content:space-between;
          padding:20px; border-bottom:1px solid #e2e8f0;
        }
        .perm-drawer-title {
          display:flex; align-items:center; gap:8px;
          font-size:16px; font-weight:700; color:#1e293b;
        }
        .perm-drawer-sub { font-size:12.5px; color:#64748b; margin-top:3px; }
        .drawer-close-btn {
          background:none; border:none; cursor:pointer; color:#94a3b8;
          font-size:16px; padding:4px; border-radius:4px; transition:color 0.15s;
        }
        .drawer-close-btn:hover { color:#dc2626; }

        /* ── Drawer month nav ── */
        .drawer-month-nav {
          display:flex; align-items:center; gap:10px; padding:12px 20px;
          background:#f8fafc; border-bottom:1px solid #e2e8f0; justify-content:center;
        }
        .month-nav-btn {
          background:#f1f5f9; border:1px solid #e2e8f0; border-radius:8px;
          width:30px; height:30px; display:flex; align-items:center; justify-content:center;
          cursor:pointer; color:#475569; transition:background 0.15s; font-size:12px;
        }
        .month-nav-btn:hover { background:#e0f7f9; color:#0b91ac; border-color:#b2ebf2; }
        .month-nav-label {
          display:flex; align-items:center; gap:6px;
          font-size:13.5px; font-weight:600; color:#1e293b;
          min-width:160px; justify-content:center;
        }
        .month-nav-icon { color:#0b91ac; font-size:13px; }

        /* ── Drawer body ── */
        .perm-drawer-body { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; }
        .drawer-empty { text-align:center; color:#94a3b8; font-size:13.5px; padding:40px 0; }

        /* ── Permission card ── */
        .perm-drawer-card {
          border:1px solid #e2e8f0; border-radius:10px; padding:14px;
          display:flex; flex-direction:column; gap:8px;
          transition:box-shadow 0.15s;
        }
        .perm-drawer-card:hover { box-shadow:0 2px 12px rgba(0,0,0,0.08); }
        .perm-card-top { display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .perm-card-date { font-size:13px; font-weight:600; color:#374151; }
        .perm-card-times { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .perm-card-reason { font-size:13px; color:#475569; line-height:1.45; }
        .perm-card-approver { font-size:11.5px; color:#9ca3af; }

        /* ── Shared time tags (used in both table and drawer) ── */
        .perm-time-tag {
          display:inline-flex; align-items:center; gap:3px;
          font-size:11.5px; font-weight:500; padding:2px 7px;
          border-radius:10px; white-space:nowrap;
        }
        .perm-time-start { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
        .perm-time-end   { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }
        .perm-time-sep   { font-size:11px; color:#9ca3af; }
        .perm-duration-badge {
          display:inline-block; padding:2px 9px; border-radius:12px;
          background:#ede9fe; color:#6d28d9; font-size:11.5px; font-weight:600;
          border:1px solid #ddd6fe;
        }
        .perm-status-badge {
          display:inline-block; padding:3px 10px; border-radius:20px;
          font-size:11.5px; font-weight:600; white-space:nowrap;
        }

        /* ── Drawer footer ── */
        .perm-drawer-footer {
          padding:14px 20px; border-top:1px solid #e2e8f0;
          display:flex; align-items:center; justify-content:space-between;
          font-size:12.5px; color:#64748b; background:#f8fafc;
        }
        .perm-drawer-total-hrs { font-weight:600; color:#0b91ac; }
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

export default EmployeeDetails;