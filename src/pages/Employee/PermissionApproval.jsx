import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
  getDetail: (id)       => apiFetch(`${BASE}/${id}/`),
  review   : (id, body) => apiFetch(`${BASE}/${id}/review/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }),
};

/* ─── FORMAT HELPERS ─────────────────────────────────────────────────────── */
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtFull = (iso) => iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

/* ─── BADGE ──────────────────────────────────────────────────────────────── */
function Badge({ value }) {
  const map = {
    ACTIVE    : { bg: "#e6f7ea", color: "#16a34a" },
    COMPLETED : { bg: "#e0f2fe", color: "#0b91ac" },
    REJECTED  : { bg: "#fee2e2", color: "#dc2626" },
    PENDING   : { bg: "#fff3e0", color: "#d97706" },
    APPROVED  : { bg: "#ecfdf5", color: "#059669" },
    MID_DAY   : { bg: "#fff8e1", color: "#b45309" },
    END_DAY   : { bg: "#ede9fe", color: "#6d28d9" },
    EMERGENCY : { bg: "#fee2e2", color: "#dc2626" },
    PREPLANNED: { bg: "#e0f2fe", color: "#0b91ac" },
  };
  const labels = {
    ACTIVE: "Active", COMPLETED: "Completed", REJECTED: "Rejected",
    PENDING: "Pending", APPROVED: "Approved",
    MID_DAY: "Mid Day", END_DAY: "End of Day",
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

function InfoRow({ label, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#222", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{children || "—"}</span>
    </div>
  );
}

export default function AdminReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [permission, setPermission] = useState(null);
  const [loading,   setLoading]     = useState(true);
  const [action,    setAction]      = useState(null);    // "APPROVED" | "REJECTED"
  const [remarks,   setRemarks]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,     setError]       = useState(null);
  const [success,   setSuccess]     = useState(false);
  const [notFound,  setNotFound]    = useState(false);

  useEffect(() => {
    if (!id) return;
    
    api.getDetail(id)
      .then((data) => {
        if (data.success && data.permission) {
          const perm = data.permission;
          
          // Check if already reviewed
          if (perm.status !== "PENDING") {
            setError(`This permission has already been ${perm.status.toLowerCase()}.`);
            setPermission(perm);
          } else {
            setPermission(perm);
          }
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!action) {
      setError("Please select Approve or Reject.");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const data = await api.review(id, {
        status: action,
        admin_remarks: remarks.trim() || "",
      });
      
      if (data.success) {
        setSuccess(true);
        setPermission(data.permission);
      } else {
        setError(data.message || "Failed to process request. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const permTypeLabel = permission?.permission_type === "END_DAY" ? "End of Day" : "Mid Day";

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTop: "3px solid #0b91ac", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ fontSize: 14, color: "#666" }}>Loading permission details…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not found
  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa", padding: 20 }}>
        <div style={{ maxWidth: 450, width: "100%", background: "#fff", borderRadius: 16, padding: 40, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 64, color: "#fca5a5", marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#222", marginBottom: 8 }}>Permission Not Found</h2>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>The permission request you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate("/admin/permissions")}
            style={{ padding: "12px 24px", borderRadius: 8, border: "none", background: "#0b91ac", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            <i className="fa-solid fa-arrow-left" style={{ marginRight: 8 }} />Back to Permissions
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success && permission) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa", padding: 20 }}>
        <div style={{ maxWidth: 500, width: "100%", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <div style={{ background: permission.status === "APPROVED" ? "#16a34a" : "#dc2626", padding: "32px", textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>
              <i className={`fa-solid fa-${permission.status === "APPROVED" ? "circle-check" : "circle-xmark"}`} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>
              Permission {permission.status === "APPROVED" ? "Approved" : "Rejected"}
            </h1>
            <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>
              {permission.status === "APPROVED" 
                ? "The employee has been notified and can now start their permission."
                : "The employee has been notified of this decision."}
            </p>
          </div>
          
          <div style={{ padding: 24 }}>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <InfoRow label="Employee">{permission.employee_name}</InfoRow>
              <InfoRow label="Type"><Badge value={permission.permission_type} /></InfoRow>
              <InfoRow label="Planned Date">{fmtDate(permission.date)}</InfoRow>
              <InfoRow label="Expected Return">{fmtFull(permission.expected_end_time)}</InfoRow>
              {remarks && <InfoRow label="Your Remarks">{remarks}</InfoRow>}
            </div>
            
            <button
              onClick={() => navigate("/attendance/permissions")}
              style={{ width: "100%", padding: "14px", borderRadius: 8, border: "none", background: "#0b91ac", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              <i className="fa-solid fa-list" style={{ marginRight: 8 }} />View All Permissions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Already reviewed state
  if (permission && permission.status !== "PENDING") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa", padding: 20 }}>
        <div style={{ maxWidth: 500, width: "100%", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <div style={{ background: "#f59e0b", padding: "32px", textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>
              <i className="fa-solid fa-clock-rotate-left" />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Already Reviewed</h1>
          </div>
          
          <div style={{ padding: 24 }}>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <InfoRow label="Status"><Badge value={permission.status} /></InfoRow>
              <InfoRow label="Employee">{permission.employee_name}</InfoRow>
              <InfoRow label="Reviewed By">{permission.reviewed_by_name || "—"}</InfoRow>
              {permission.admin_remarks && <InfoRow label="Remarks">{permission.admin_remarks}</InfoRow>}
            </div>
            
            <button
              onClick={() => navigate("/attendance/permissions")}
              style={{ width: "100%", padding: "14px", borderRadius: 8, border: "none", background: "#0b91ac", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              <i className="fa-solid fa-list" style={{ marginRight: 8 }} />View All Permissions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Review form
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa", padding: 20 }}>
      <div style={{ maxWidth: 550, width: "100%", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        
        {/* Header */}
        <div style={{ background: "#0b91ac", padding: "28px 28px 20px", color: "#fff" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fa-solid fa-clipboard-check" />
            Review Permission Request
          </h1>
          <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
            Review the details below and make a decision.
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: 28 }}>
          
          {/* Permission Details Card */}
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 18, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#0b91ac", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <i className="fa-solid fa-user" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>{permission?.employee_name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{permission?.employee_code}</div>
              </div>
            </div>
            
            {[
              ["Permission Type", <Badge key="type" value={permission?.permission_type} />],
              ["Request Type", <Badge key="req" value={permission?.request_type} />],
              ["Planned Date", fmtDate(permission?.date)],
              ["Expected Return", fmtFull(permission?.expected_end_time)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", padding: "8px 0" }}>
                <span style={{ width: 120, fontSize: 11, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13, color: "#444", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
            
            <div style={{ marginTop: 12, padding: 12, background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Reason</div>
              <div style={{ fontSize: 14, color: "#333", lineHeight: 1.5 }}>{permission?.reason}</div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#dc2626", fontSize: 13, marginBottom: 20 }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }} />{error}
            </div>
          )}

          {/* Decision buttons */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
              Decision <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setAction("APPROVED")}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 15,
                  border: action === "APPROVED" ? "2px solid #16a34a" : "2px solid #e5e7eb",
                  background: action === "APPROVED" ? "#dcfce7" : "#fff",
                  color: action === "APPROVED" ? "#16a34a" : "#999",
                  transition: "all 0.15s",
                }}
              >
                <i className="fa-solid fa-check-circle" style={{ marginRight: 8 }} />Approve
              </button>
              <button
                type="button"
                onClick={() => setAction("REJECTED")}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 15,
                  border: action === "REJECTED" ? "2px solid #dc2626" : "2px solid #e5e7eb",
                  background: action === "REJECTED" ? "#fee2e2" : "#fff",
                  color: action === "REJECTED" ? "#dc2626" : "#999",
                  transition: "all 0.15s",
                }}
              >
                <i className="fa-solid fa-xmark-circle" style={{ marginRight: 8 }} />Reject
              </button>
            </div>
          </div>

          {/* Remarks */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              Remarks (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add a note for the employee (e.g., reason for rejection, special instructions)..."
              rows={3}
              style={{
                width: "100%",
                border: "1px solid #d0d0d0",
                borderRadius: 8,
                padding: "12px 14px",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                background: "#fafafa",
              }}
            />
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !action}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 15,
              background: action === "REJECTED" ? "#dc2626" : "#16a34a",
              color: "#fff",
              opacity: submitting || !action ? 0.6 : 1,
              transition: "all 0.15s",
            }}
          >
            {submitting ? (
              <>
                <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", marginRight: 8, verticalAlign: "middle" }} />
                Processing…
              </>
            ) : action === "APPROVED" ? (
              <>
                <i className="fa-solid fa-check" style={{ marginRight: 8 }} />Confirm Approval
              </>
            ) : action === "REJECTED" ? (
              <>
                <i className="fa-solid fa-xmark" style={{ marginRight: 8 }} />Confirm Rejection
              </>
            ) : (
              "Select a decision above"
            )}
          </button>

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <button
              onClick={() => navigate("/admin/permissions")}
              style={{ background: "none", border: "none", color: "#0b91ac", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
            >
              <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />Back to all permissions
            </button>
          </div>
        </div>
      </div>
      
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}