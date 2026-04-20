import { useState, useEffect, useCallback } from "react";

/* ─── FONT AWESOME ───────────────────────────────────────────────────────── */
if (!document.getElementById("fa-cdn")) {
  const link = document.createElement("link");
  link.id = "fa-cdn"; link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
  document.head.appendChild(link);
}

/* ─── API ─────────────────────────────────────────────────────────────────── */
const BASE = "/api/attendance/employee-permissions";
const apiFetch = (url, opts = {}) =>
  fetch(url, { credentials: "include", ...opts }).then((r) => r.json());

const api = {
  getList : (qs = "") => apiFetch(`${BASE}/?${qs}`),
  review  : (id, body) => apiFetch(`${BASE}/${id}/review/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }),
};

/* ─── FORMAT HELPERS ─────────────────────────────────────────────────────── */
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtFull = (iso) => iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";

/* ─── BADGE ──────────────────────────────────────────────────────────────── */
function Badge({ value }) {
  const map = {
    ACTIVE    : { bg: "#e6f7ea", color: "#16a34a" },
    COMPLETED : { bg: "#e0f2fe", color: "#0b91ac" },
    REJECTED  : { bg: "#fee2e2", color: "#dc2626" },
    PENDING   : { bg: "#fff3e0", color: "#d97706" },
    APPROVED  : { bg: "#ecfdf5", color: "#059669" },
    OK        : { bg: "#e6f7ea", color: "#16a34a" },
    OVERUSED  : { bg: "#fff3e0", color: "#e65100" },
    MID_DAY   : { bg: "#fff8e1", color: "#b45309" },
    END_DAY   : { bg: "#ede9fe", color: "#6d28d9" },
    EMERGENCY : { bg: "#fee2e2", color: "#dc2626" },
    PREPLANNED: { bg: "#e0f2fe", color: "#0b91ac" },
  };
  const labels = {
    ACTIVE: "Active", COMPLETED: "Completed", REJECTED: "Rejected",
    PENDING: "Pending", APPROVED: "Approved",
    OK: "OK", OVERUSED: "Overused", MID_DAY: "Mid Day", END_DAY: "End of Day",
    EMERGENCY: "Emergency", PREPLANNED: "Pre-planned",
  };
  const s = map[value] || { bg: "#f0f0f0", color: "#888" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {labels[value] || value}
    </span>
  );
}

/* ─── MODAL ──────────────────────────────────────────────────────────────── */
function ReviewModal({ permission, onClose, onDone }) {
  const [action,  setAction]  = useState(null);    // "APPROVED" | "REJECTED"
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const perm_type_label = permission.permission_type === "END_DAY" ? "End of Day" : "Mid Day";

  const handleSubmit = async () => {
    if (!action) { setError("Please select Approve or Reject."); return; }
    setLoading(true); setError(null);
    try {
      const data = await api.review(permission.id, { status: action, admin_remarks: remarks });
      if (data.success) onDone(data.permission);
      else setError(data.message || "Failed. Please try again.");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>

        {/* Modal header */}
        <div style={{ background: "#0b91ac", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Review Permission</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 }}>{permission.employee_name} — {perm_type_label}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", fontSize: 18 }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div style={{ padding: "24px" }}>

          {/* Details */}
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "16px", marginBottom: 20 }}>
            {[
              ["Employee",     permission.employee_name],
              ["Employee ID",  permission.employee_code],
              ["Perm Type",    perm_type_label],
              ["Planned Date", fmtDate(permission.date)],
              ["Exp. Return",  fmtFull(permission.expected_end_time)],
              ["Reason",       permission.reason],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ width: 110, fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 13, color: "#222", fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Decision *</label>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setAction("APPROVED")}
                style={{
                  flex: 1, padding: "12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit", transition: "all 0.15s",
                  border: action === "APPROVED" ? "2px solid #16a34a" : "2px solid #e5e7eb",
                  background: action === "APPROVED" ? "#dcfce7" : "#fff",
                  color: action === "APPROVED" ? "#16a34a" : "#999",
                }}
              >
                <i className="fa-solid fa-check" style={{ marginRight: 8 }} />Approve
              </button>
              <button
                onClick={() => setAction("REJECTED")}
                style={{
                  flex: 1, padding: "12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit", transition: "all 0.15s",
                  border: action === "REJECTED" ? "2px solid #dc2626" : "2px solid #e5e7eb",
                  background: action === "REJECTED" ? "#fee2e2" : "#fff",
                  color: action === "REJECTED" ? "#dc2626" : "#999",
                }}
              >
                <i className="fa-solid fa-xmark" style={{ marginRight: 8 }} />Reject
              </button>
            </div>
          </div>

          {/* Remarks */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Remarks (optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add a note for the employee…"
              rows={3}
              style={{ width: "100%", border: "1px solid #d0d0d0", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 14 }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />{error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "1px solid #d0d0d0", cursor: "pointer", background: "#fff", color: "#444", fontWeight: 600, fontSize: 14, fontFamily: "inherit" }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !action}
              style={{
                flex: 2, padding: "12px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                background: action === "REJECTED" ? "#dc2626" : "#16a34a",
                color: "#fff", opacity: (loading || !action) ? 0.5 : 1,
              }}
            >
              {loading
                ? <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", marginRight: 6, verticalAlign: "middle" }} />Submitting…</>
                : action === "APPROVED" ? "Confirm Approve" : action === "REJECTED" ? "Confirm Reject" : "Select a Decision"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN — PermissionList (Admin)
══════════════════════════════════════════════════════════════ */
export default function PermissionList() {
  const [list,      setList]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);    // permission open in modal
  const [filters, setFilters] = useState({ status: "", type: "", request_type: "" });
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filters.status)       qs.append("status",       filters.status);
      if (filters.type)         qs.append("type",         filters.type);
      if (filters.request_type) qs.append("request_type", filters.request_type);
      const data = await api.getList(qs.toString());
      setList(data.permissions || []);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleDone = (updatedPerm) => {
    setList((prev) => prev.map((p) => p.id === updatedPerm.id ? updatedPerm : p));
    setSelected(null);
    showToast(`Permission ${updatedPerm.status.toLowerCase()} successfully.`);
  };

  const pendingCount = list.filter((p) => p.status === "PENDING").length;

  return (
    <main className="app-main">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 2000,
          background: toast.type === "success" ? "#16a34a" : "#dc2626",
          color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13,
          fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          animation: "fadeUp 0.2s ease",
        }}>
          <i className={`fa-solid ${toast.type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`} style={{ marginRight: 8 }} />
          {toast.msg}
        </div>
      )}

      <div className="pl-page-wrapper">
        <div className="pl-card">

          {/* ── Page header ── */}
          <div className="pl-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 className="pl-title">
                  <i className="fa-solid fa-clipboard-list" style={{ marginRight: 10 }} />
                  Permission Requests
                </h1>
                <p className="pl-subtitle">Review and manage employee permission requests</p>
              </div>
              {pendingCount > 0 && (
                <div style={{ background: "#fff3e0", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#d97706" }}>{pendingCount}</div>
                  <div style={{ fontSize: 11, color: "#b45309", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pending Review</div>
                </div>
              )}
            </div>
          </div>

          {/* ── Filters ── */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <select
              className="pl-select"
              value={filters.request_type}
              onChange={(e) => setFilters((f) => ({ ...f, request_type: e.target.value }))}
            >
              <option value="">All Request Types</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="PREPLANNED">Pre-planned</option>
            </select>
            <select
              className="pl-select"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              className="pl-select"
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="">All Perm Types</option>
              <option value="MID_DAY">Mid Day</option>
              <option value="END_DAY">End Day</option>
            </select>
            <button className="pl-refresh-btn" onClick={load}>
              <i className="fa-solid fa-arrows-rotate" style={{ marginRight: 6 }} />Refresh
            </button>
            <span style={{ fontSize: 12, color: "#aaa", marginLeft: "auto" }}>{list.length} record{list.length !== 1 ? "s" : ""}</span>
          </div>

          {/* ── Table ── */}
          <div className="pl-table-wrap">
            {loading ? (
              <div style={{ padding: 60, textAlign: "center", color: "#aaa" }}>
                <div style={{ display: "inline-block", width: 18, height: 18, border: "2px solid #ccc", borderTop: "2px solid #0b91ac", borderRadius: "50%", animation: "spin 0.7s linear infinite", marginBottom: 10 }} />
                <div style={{ fontSize: 13 }}>Loading permissions…</div>
              </div>
            ) : list.length === 0 ? (
              <div style={{ padding: 80, textAlign: "center", color: "#ccc" }}>
                <i className="fa-solid fa-clipboard-list" style={{ fontSize: 40, marginBottom: 12, display: "block" }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No permissions found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Try changing the filters above</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Employee", "Planned Date", "Perm Type", "Request Type", "Expected Return", "Reason", "Status", "Action"].map((h) => (
                      <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "#aaa", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => {
                    const isPending = p.status === "PENDING";
                    return (
                      <tr
                        key={p.id}
                        style={{ transition: "background 0.12s", background: isPending ? "#fffbf0" : "" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = isPending ? "#fff8e6" : "#f9fbff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = isPending ? "#fffbf0" : "")}
                      >
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f9f9f9", verticalAlign: "middle" }}>
                          <div style={{ fontWeight: 700, color: "#222", fontSize: 13 }}>{p.employee_name || "—"}</div>
                          <div style={{ fontSize: 11, color: "#aaa" }}>{p.employee_code}</div>
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f9f9f9", fontSize: 13, color: "#444", verticalAlign: "middle" }}>
                          {fmtDate(p.date)}
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f9f9f9", verticalAlign: "middle" }}>
                          <Badge value={p.permission_type} />
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f9f9f9", verticalAlign: "middle" }}>
                          <Badge value={p.request_type} />
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f9f9f9", fontSize: 13, color: "#444", verticalAlign: "middle" }}>
                          {fmtFull(p.expected_end_time)}
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f9f9f9", fontSize: 13, color: "#666", maxWidth: 200, verticalAlign: "middle" }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.reason}>{p.reason}</div>
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f9f9f9", verticalAlign: "middle" }}>
                          <Badge value={p.status} />
                          {p.reviewed_by_name && (
                            <div style={{ fontSize: 10, color: "#bbb", marginTop: 3 }}>by {p.reviewed_by_name}</div>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f9f9f9", verticalAlign: "middle" }}>
                          {isPending ? (
                            <button
                              onClick={() => setSelected(p)}
                              style={{ padding: "8px 16px", borderRadius: 7, border: "none", cursor: "pointer", background: "#0b91ac", color: "#fff", fontWeight: 600, fontSize: 12, fontFamily: "inherit", whiteSpace: "nowrap" }}
                            >
                              <i className="fa-solid fa-pen-to-square" style={{ marginRight: 6 }} />Review
                            </button>
                          ) : (
                            <div style={{ fontSize: 12, color: "#999" }}>
                              {p.admin_remarks || <span style={{ color: "#ddd" }}>No remarks</span>}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>

      {/* ── Review Modal ── */}
      {selected && (
        <ReviewModal
          permission={selected}
          onClose={() => setSelected(null)}
          onDone={handleDone}
        />
      )}

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }

        .pl-page-wrapper { width:100%; max-width:1100px; margin-inline:auto; padding:8px 16px 40px; box-sizing:border-box; }
        .pl-card {
          margin-top: 113px;
          background:#fff;
          border-radius:16px;
          box-shadow:0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.05);
          overflow:hidden;
        }
        .pl-header {
          padding: 28px 28px 20px;
          border-bottom: 2px solid #ff9800;
        }
        .pl-title {
          font-size: clamp(18px, 3vw, 24px);
          font-weight: 800;
          color: #0b91ac;
          margin: 0 0 4px;
          display: flex;
          align-items: center;
        }
        .pl-subtitle { font-size:13px; color:#aaa; margin:0; }

        .pl-table-wrap { overflow-x:auto; }

        .pl-select {
          border:1px solid #d0d0d0; border-radius:8px; padding:8px 12px;
          font-size:12px; font-family:inherit; outline:none;
          background:#fafafa; color:#444; cursor:pointer;
        }
        .pl-select:focus { border-color:#0b91ac; }

        .pl-refresh-btn {
          padding:8px 14px; border-radius:8px; border:none;
          cursor:pointer; background:#0b91ac; color:#fff;
          font-weight:600; font-size:12px; font-family:inherit;
        }
        .pl-refresh-btn:hover { filter:brightness(0.92); }

        /* filters + stats row inside pl-card */
        .pl-card > div:not(.pl-header):not(.pl-table-wrap) { padding: 20px 28px 0; }

        @media (max-width: 767px) {
          .pl-card { border-radius:12px; }
          .pl-header { padding:18px 16px 14px; }
        }
      `}</style>
    </main>
  );
}