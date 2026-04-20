import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaClockRotateLeft, FaCalendarDay, FaClock, FaUser,
  FaCircleCheck, FaCircleXmark, FaHourglassHalf,
  FaArrowLeft, FaComment,
} from "react-icons/fa6";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt12 = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const fmtDateTime = (dt) => {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const calcHours = (start, end) => {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
};

const STATUS_META = {
  pending:  { label: "Pending Review", color: "#ff9800", bg: "#fff8e1", icon: <FaHourglassHalf /> },
  approved: { label: "Approved",       color: "#22c55e", bg: "#f0fdf4", icon: <FaCircleCheck /> },
  declined: { label: "Declined",       color: "#e53935", bg: "#fef2f2", icon: <FaCircleXmark /> },
};

// ─── Info Row component ──────────────────────────────────────────────────────

const InfoRow = ({ label, value, highlight }) => (
  <div className="otrv-info-row">
    <span className="otrv-info-label">{label}</span>
    <span className={`otrv-info-value${highlight ? " otrv-info-value--highlight" : ""}`}>{value}</span>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const OTReview = () => {
  const { ot_id } = useParams();
  const navigate  = useNavigate();

  const [ot,           setOt]           = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [notFound,     setNotFound]     = useState(false);
  const [action,       setAction]       = useState(""); // "approve" | "decline"
  const [remarks,      setRemarks]      = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  const [popupConfig, setPopupConfig] = useState({
    show: false, type: "info", title: "", message: "",
    confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null,
  });

  const openPopup = (cfg) =>
    setPopupConfig({ show: true, type: "info", title: "", message: "", confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null, ...cfg });
  const closePopup = () => setPopupConfig((p) => ({ ...p, show: false }));

  // ── fetch OT request ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchOT = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/attendance/ot-requests/${ot_id}/`);
        setOt(res.data?.ot_request || null);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (ot_id) fetchOT();
  }, [ot_id]);

  // ── submit review ────────────────────────────────────────────────────────
  const handleReview = async (decision) => {
    if (decision === "declined" && !remarks.trim()) {
      setRemarksError("Please provide a reason for declining.");
      return;
    }
    setRemarksError("");

    openPopup({
      type: "warning",
      title: decision === "approved" ? "Approve OT Request?" : "Decline OT Request?",
      message: decision === "approved"
        ? `This will approve the OT request for ${ot?.employee_name}. The employee will be notified.`
        : `This will decline the OT request for ${ot?.employee_name}. The employee will be notified.`,
      showCancel: true,
      confirmText: decision === "approved" ? "Yes, Approve" : "Yes, Decline",
      onConfirm: async () => {
        closePopup();
        setSubmitting(true);
        try {
          const payload = { status: decision, admin_remarks: remarks };
          const res = await api.post(`/api/attendance/ot-requests/${ot_id}/review/`, payload);
          const updated = res.data?.ot_request;
          setOt(updated);
          setAction("");
          openPopup({
            type: "success",
            title: decision === "approved" ? "OT Approved!" : "OT Declined",
            message: `The OT request has been ${decision}. The employee has been notified via email.`,
            confirmText: "OK",
            onConfirm: () => { closePopup(); navigate("/attendance/ot-requests"); },
          });
        } catch (err) {
          const msg = err.response?.data?.message
            || Object.values(err.response?.data?.errors || {}).flat().join(" ")
            || "Failed to submit review.";
          openPopup({ type: "error", title: "Review Failed", message: msg });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  // ── states ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="app-main">
        <div className="max-w-4xl mx-auto px-4 py-12 otrv-loading">
          <span className="otrv-spinner-lg" />
          <p>Loading OT request…</p>
        </div>
      </main>
    );
  }

  if (notFound || !ot) {
    return (
      <main className="app-main">
        <div className="max-w-4xl mx-auto px-4 py-12 otrv-loading">
          <FaCircleXmark className="otrv-notfound-icon" />
          <p>OT request not found or you don't have access.</p>
          <button className="btn btn-back otrv-back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Go Back
          </button>
        </div>
      </main>
    );
  }

  const meta       = STATUS_META[ot.status] || STATUS_META.pending;
  const dailyHours = calcHours(ot.start_time, ot.end_time);
  const isPending  = ot.status === "pending";

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <main className="app-main">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AutoBreadcrumb />

          {/* Back button */}
          <button className="btn btn-back otrv-back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
          </button>

          <div className="otrv-page">

            {/* ══ HEADER CARD ══════════════════════════════════════════════ */}
            <div className="otrv-header-card">
              <div className="otrv-header-left">
                <div className="otrv-avatar">
                  {ot.employee_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className="otrv-employee-name">{ot.employee_name}</div>
                  {ot.employee_code && (
                    <div className="otrv-employee-code">Employee #{ot.employee_code}</div>
                  )}
                </div>
              </div>
              <span className="otrv-status-badge" style={{ color: meta.color, background: meta.bg }}>
                {meta.icon}&nbsp;{meta.label}
              </span>
            </div>

            {/* ══ DETAILS CARD ═════════════════════════════════════════════ */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="otrv-section-title">
                <FaClockRotateLeft className="otrv-section-icon" />
                OT Request Details
              </h3>
              <div className="otrv-divider" />

              <div className="otrv-info-grid">
                <div className="otrv-info-col">
                  <h4 className="otrv-col-title"><FaCalendarDay /> Date Range</h4>
                  <InfoRow label="Start Date"  value={fmtDate(ot.start_date)} />
                  <InfoRow label="End Date"    value={fmtDate(ot.end_date)} />
                  <InfoRow label="Total Days"  value={ot.total_days ?? "—"} highlight />
                  <InfoRow label="Submitted"   value={fmtDateTime(ot.created_at)} />
                </div>
                <div className="otrv-info-col">
                  <h4 className="otrv-col-title"><FaClock /> OT Timing</h4>
                  <InfoRow label="OT Start"    value={fmt12(ot.start_time)} />
                  <InfoRow label="OT End"      value={fmt12(ot.end_time)} />
                  <InfoRow label="Daily Hours" value={dailyHours ?? "—"} highlight />
                  <InfoRow label="Total Hours" value={ot.total_hours != null ? `${ot.total_hours}h` : "—"} highlight />
                </div>
              </div>

              {ot.reason && (
                <div className="otrv-reason-box">
                  <span className="otrv-reason-label">Reason from Employee</span>
                  <p>{ot.reason}</p>
                </div>
              )}

              {/* Already reviewed */}
              {!isPending && (
                <div className="otrv-reviewed-box" style={{ borderLeftColor: meta.color }}>
                  <div className="otrv-reviewed-title" style={{ color: meta.color }}>
                    {meta.icon}&nbsp;This request has been {ot.status}
                  </div>
                  {ot.reviewed_by_name && (
                    <InfoRow label="Reviewed by" value={ot.reviewed_by_name} />
                  )}
                  {ot.reviewed_at && (
                    <InfoRow label="Reviewed at" value={fmtDateTime(ot.reviewed_at)} />
                  )}
                  {ot.admin_remarks && (
                    <div className="otrv-reviewed-remarks">
                      <span className="otrv-reason-label">Admin Remarks</span>
                      <p>{ot.admin_remarks}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ══ REVIEW ACTION CARD (only if pending) ═════════════════════ */}
            {isPending && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="otrv-section-title">
                  <FaComment className="otrv-section-icon" />
                  Review Decision
                </h3>
                <div className="otrv-divider" />

                {/* Action buttons */}
                {!action && (
                  <div className="otrv-action-row">
                    <button
                      type="button"
                      className="otrv-approve-btn"
                      onClick={() => setAction("approve")}
                      disabled={submitting}
                    >
                      <FaCircleCheck /> Approve OT Request
                    </button>
                    <button
                      type="button"
                      className="otrv-decline-btn"
                      onClick={() => setAction("decline")}
                      disabled={submitting}
                    >
                      <FaCircleXmark /> Decline OT Request
                    </button>
                  </div>
                )}

                {/* Approve panel */}
                {action === "approve" && (
                  <div className="otrv-decision-panel otrv-decision-panel--approve">
                    <div className="otrv-decision-header">
                      <FaCircleCheck className="otrv-decision-icon otrv-decision-icon--approve" />
                      <span>Approving OT for <strong>{ot.employee_name}</strong></span>
                    </div>
                    <div className="ef-field">
                      <label>Admin Remarks <span className="ef-optional">(Optional)</span></label>
                      <textarea
                        rows={3}
                        placeholder="Add any remarks for the employee (optional)…"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>
                    <div className="otrv-decision-actions">
                      <button type="button" className="btn btn-back" onClick={() => { setAction(""); setRemarks(""); setRemarksError(""); }}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="otrv-confirm-approve-btn"
                        onClick={() => handleReview("approved")}
                        disabled={submitting}
                      >
                        {submitting ? <span className="otr-spinner" /> : <FaCircleCheck />}
                        Confirm Approval
                      </button>
                    </div>
                  </div>
                )}

                {/* Decline panel */}
                {action === "decline" && (
                  <div className="otrv-decision-panel otrv-decision-panel--decline">
                    <div className="otrv-decision-header">
                      <FaCircleXmark className="otrv-decision-icon otrv-decision-icon--decline" />
                      <span>Declining OT for <strong>{ot.employee_name}</strong></span>
                    </div>
                    <div className="ef-field">
                      <label className="required">Reason for Declining</label>
                      <textarea
                        rows={3}
                        placeholder="Please provide a reason for declining this OT request…"
                        value={remarks}
                        onChange={(e) => { setRemarks(e.target.value); setRemarksError(""); }}
                      />
                      {remarksError && <p className="error-message">{remarksError}</p>}
                    </div>
                    <div className="otrv-decision-actions">
                      <button type="button" className="btn btn-back" onClick={() => { setAction(""); setRemarks(""); setRemarksError(""); }}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="otrv-confirm-decline-btn"
                        onClick={() => handleReview("declined")}
                        disabled={submitting}
                      >
                        {submitting ? <span className="otr-spinner" /> : <FaCircleXmark />}
                        Confirm Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      <style>{`
        /* layout */
        .otrv-page { display:flex; flex-direction:column; gap:16px; margin-top:16px; }
        .otrv-back-btn { margin-bottom:12px; display:inline-flex; align-items:center; gap:6px; }

        /* loading / not found */
        .otrv-loading { display:flex; flex-direction:column; align-items:center; gap:16px; text-align:center; color:#aaa; }
        .otrv-spinner-lg {
          display:block; width:36px; height:36px;
          border:3px solid #e0e0e0; border-top-color:var(--primary,#0b91ac);
          border-radius:50%; animation:otr-spin 0.8s linear infinite;
        }
        .otrv-notfound-icon { font-size:48px; color:#f5c6cb; }

        /* header card */
        .otrv-header-card {
          display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;
          background:#fff; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.07);
          padding:20px 24px;
        }
        .otrv-header-left { display:flex; align-items:center; gap:14px; }
        .otrv-avatar {
          width:48px; height:48px; border-radius:50%;
          background:var(--primary,#0b91ac); color:#fff;
          display:flex; align-items:center; justify-content:center;
          font-size:20px; font-weight:700; flex-shrink:0;
        }
        .otrv-employee-name { font-size:18px; font-weight:700; color:#222; }
        .otrv-employee-code { font-size:13px; color:#aaa; margin-top:2px; }
        .otrv-status-badge {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 14px; border-radius:20px; font-size:13px; font-weight:700;
        }

        /* details card */
        .otrv-section-title {
          display:flex; align-items:center; gap:8px;
          font-size:16px; font-weight:700; color:var(--primary,#0b91ac); margin:0 0 4px;
        }
        .otrv-section-icon { font-size:15px; }
        .otrv-divider { height:2px; background:var(--accent,#ff9800); border-radius:2px; margin-bottom:20px; }

        .otrv-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:20px; }
        .otrv-info-col { display:flex; flex-direction:column; gap:10px; }
        .otrv-col-title {
          display:flex; align-items:center; gap:6px;
          font-size:12px; font-weight:700; color:#aaa;
          text-transform:uppercase; letter-spacing:0.5px; margin:0 0 4px;
        }
        .otrv-info-row { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid #f0f0f0; }
        .otrv-info-row:last-child { border-bottom:none; }
        .otrv-info-label { font-size:12px; color:#888; font-weight:500; }
        .otrv-info-value { font-size:13px; color:#333; font-weight:600; }
        .otrv-info-value--highlight { color:var(--primary,#0b91ac); }

        .otrv-reason-box {
          background:#f8fafc; border-left:3px solid #e0e0e0;
          border-radius:8px; padding:12px 16px; margin-top:8px;
        }
        .otrv-reason-label { font-size:11px; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:0.5px; }
        .otrv-reason-box p { margin:6px 0 0; font-size:13px; color:#555; line-height:1.6; }

        .otrv-reviewed-box {
          margin-top:20px; padding:16px; border-left:4px solid;
          background:#fafafa; border-radius:8px;
        }
        .otrv-reviewed-title {
          display:flex; align-items:center; gap:8px;
          font-size:14px; font-weight:700; margin-bottom:12px;
        }
        .otrv-reviewed-remarks { margin-top:10px; }
        .otrv-reviewed-remarks p { margin:4px 0 0; font-size:13px; color:#555; }

        /* review action card */
        .otrv-action-row { display:flex; gap:12px; flex-wrap:wrap; }
        .otrv-approve-btn, .otrv-decline-btn {
          display:inline-flex; align-items:center; gap:8px;
          padding:12px 24px; border-radius:10px; font-size:14px; font-weight:700;
          cursor:pointer; border:none; transition:opacity 0.18s, transform 0.12s;
        }
        .otrv-approve-btn { background:#22c55e; color:#fff; }
        .otrv-approve-btn:hover { opacity:0.9; transform:translateY(-1px); }
        .otrv-decline-btn { background:#e53935; color:#fff; }
        .otrv-decline-btn:hover { opacity:0.9; transform:translateY(-1px); }

        .otrv-decision-panel {
          border-radius:10px; padding:20px; margin-top:0;
          animation:otr-fade-in 0.2s ease;
        }
        .otrv-decision-panel--approve { background:#f0fdf4; border:1.5px solid #bbf7d0; }
        .otrv-decision-panel--decline { background:#fef2f2; border:1.5px solid #fecaca; }
        .otrv-decision-header {
          display:flex; align-items:center; gap:10px;
          font-size:14px; font-weight:600; color:#333; margin-bottom:16px;
        }
        .otrv-decision-icon { font-size:18px; }
        .otrv-decision-icon--approve { color:#22c55e; }
        .otrv-decision-icon--decline { color:#e53935; }

        .otrv-decision-actions {
          display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap; margin-top:16px;
        }
        .otrv-confirm-approve-btn, .otrv-confirm-decline-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:10px 22px; border-radius:8px; font-size:13px; font-weight:700;
          cursor:pointer; border:none;
        }
        .otrv-confirm-approve-btn { background:#22c55e; color:#fff; }
        .otrv-confirm-decline-btn { background:#e53935; color:#fff; }
        .otrv-confirm-approve-btn:disabled,
        .otrv-confirm-decline-btn:disabled { opacity:0.6; cursor:not-allowed; }

        /* ef helpers */
        .ef-field { display:flex; flex-direction:column; gap:5px; }
        .ef-optional { font-size:12px; color:#888; font-weight:400; }
        .ef-field label { font-size:13px; font-weight:600; color:#444; }
        .ef-field label.required::after { content:" *"; color:#e53935; }
        .ef-field textarea { width:100%; box-sizing:border-box; }
        .error-message { font-size:12px; color:#e53935; margin:0; }

        .otr-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:otr-spin 0.7s linear infinite; }
        @keyframes otr-spin { to{transform:rotate(360deg)} }
        @keyframes otr-fade-in { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

        @media(max-width:640px) {
          .otrv-info-grid { grid-template-columns:1fr; }
          .otrv-action-row { flex-direction:column; }
          .otrv-approve-btn,.otrv-decline-btn { width:100%; justify-content:center; }
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
    </>
  );
};

export default OTReview;