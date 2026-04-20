import React, { useState, useEffect, useRef } from "react";
import {
  FaClockRotateLeft, FaPlus, FaClock, FaCalendarDay,
  FaCircleCheck, FaCircleXmark, FaHourglassHalf,
  FaChevronDown, FaChevronUp, FaListUl, FaXmark, FaTrash,
} from "react-icons/fa6";
import { FaRedo } from "react-icons/fa";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";

// ─── helpers ────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split("T")[0];

const calcSlotHours = (start, end) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 1440;
  return mins / 60;
};

const formatSlotHours = (start, end) => {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
};

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

const calcDays = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e - s) / 86400000) + 1;
  return diff > 0 ? diff : 0;
};

// Check if two time slots overlap
const slotsOverlap = (slot1, slot2) => {
  return slot1.start_time < slot2.end_time && slot2.start_time < slot1.end_time;
};

const STATUS_META = {
  pending:  { label: "Pending",  color: "#ff9800", bg: "#fff8e1", icon: <FaHourglassHalf /> },
  approved: { label: "Approved", color: "#22c55e", bg: "#f0fdf4", icon: <FaCircleCheck /> },
  declined: { label: "Declined", color: "#e53935", bg: "#fef2f2", icon: <FaCircleXmark /> },
};

// ─── OT Request List Panel ───────────────────────────────────────────────────

const OTRequestList = ({ requests, loading, onClose }) => {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="otr-drawer">
      <div className="otr-drawer-header">
        <div className="otr-drawer-title">
          <FaListUl className="ef-icon" />
          My OT Requests
          {!loading && <span className="otr-count-badge">{requests.length}</span>}
        </div>
        <button className="otr-drawer-close" onClick={onClose} aria-label="Close list">
          <FaXmark />
        </button>
      </div>

      <div className="otr-drawer-body">
        {loading ? (
          <div className="otr-empty">
            <span className="otr-spinner otr-spinner--lg" />
            <p>Loading your requests…</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="otr-empty">
            <FaCalendarDay className="otr-empty-icon" />
            <p>No OT requests yet.</p>
            <span>Your submitted requests will appear here.</span>
          </div>
        ) : (
          <div className="otr-list">
            {requests.map((ot) => {
              const meta = STATUS_META[ot.status] || STATUS_META.pending;
              const expanded = expandedId === ot.id;
              const days = calcDays(ot.start_date, ot.end_date);
              const slots = ot.time_slots || [];

              return (
                <div key={ot.id} className="otr-card">
                  <div
                    className="otr-card-header"
                    onClick={() => setExpandedId(expanded ? null : ot.id)}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setExpandedId(expanded ? null : ot.id)}
                  >
                    <div className="otr-card-left">
                      <span className="otr-status-pill" style={{ color: meta.color, background: meta.bg }}>
                        {meta.icon}&nbsp;{meta.label}
                      </span>
                      <div className="otr-card-date">
                        <FaCalendarDay className="otr-ic" />
                        {fmtDate(ot.start_date)}
                        {ot.end_date && ot.end_date !== ot.start_date && <> – {fmtDate(ot.end_date)}</>}
                        {days > 1 && <span className="otr-hrs-chip">{days}d</span>}
                      </div>
                      <div className="otr-card-time">
                        <FaClock className="otr-ic" />
                        {slots.length} slot{slots.length !== 1 ? "s" : ""}
                        {ot.total_hours != null && (
                          <span className="otr-hrs-chip">{ot.total_hours.toFixed(1)}h</span>
                        )}
                      </div>
                    </div>
                    <button className="otr-expand-btn" aria-label="toggle" tabIndex={-1}>
                      {expanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>

                  {expanded && (
                    <div className="otr-card-body">
                      <div className="otr-detail-grid">
                        <div className="otr-detail-item">
                          <span className="otr-detail-label">From</span>
                          <span className="otr-detail-value">{fmtDate(ot.start_date)}</span>
                        </div>
                        <div className="otr-detail-item">
                          <span className="otr-detail-label">To</span>
                          <span className="otr-detail-value">{fmtDate(ot.end_date)}</span>
                        </div>
                        <div className="otr-detail-item">
                          <span className="otr-detail-label">Total Days</span>
                          <span className="otr-detail-value">{days}</span>
                        </div>
                        <div className="otr-detail-item">
                          <span className="otr-detail-label">Total Hours</span>
                          <span className="otr-detail-value">
                            {ot.total_hours != null ? `${ot.total_hours.toFixed(1)}h` : "—"}
                          </span>
                        </div>
                        <div className="otr-detail-item">
                          <span className="otr-detail-label">Source</span>
                          <span className="otr-detail-value otr-source-badge otr-source-badge--emp">
                            Employee Request
                          </span>
                        </div>
                        <div className="otr-detail-item">
                          <span className="otr-detail-label">Submitted</span>
                          <span className="otr-detail-value">
                            {ot.created_at
                              ? new Date(ot.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </span>
                        </div>
                        {ot.status !== "pending" && ot.reviewed_by_name && (
                          <div className="otr-detail-item">
                            <span className="otr-detail-label">Reviewed by</span>
                            <span className="otr-detail-value">{ot.reviewed_by_name}</span>
                          </div>
                        )}
                        {ot.status !== "pending" && ot.reviewed_at && (
                          <div className="otr-detail-item">
                            <span className="otr-detail-label">Reviewed at</span>
                            <span className="otr-detail-value">
                              {new Date(ot.reviewed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Time Slots Section */}
                      {slots.length > 0 && (
                        <div className="otr-slots-section">
                          <span className="otr-detail-label">Daily Time Slots</span>
                          <div className="otr-slots-list">
                            {slots.map((slot, idx) => (
                              <div key={idx} className="otr-slot-item">
                                <FaClock className="otr-slot-icon" />
                                <span>{fmt12(slot.start_time)} – {fmt12(slot.end_time)}</span>
                                <span className="otr-slot-hours">
                                  ({formatSlotHours(slot.start_time, slot.end_time)})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {ot.reason && (
                        <div className="otr-reason-box">
                          <span className="otr-detail-label">Reason</span>
                          <p>{ot.reason}</p>
                        </div>
                      )}
                      {ot.admin_remarks && (
                        <div className="otr-remarks-box" style={{ borderLeftColor: meta.color }}>
                          <span className="otr-detail-label">Admin Remarks</span>
                          <p>{ot.admin_remarks}</p>
                        </div>
                      )}
                      {ot.status === "approved" && (
                        <div className="otr-locked-badge">🔒 This record is approved and locked.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const OvertimeRequest = () => {
  const formRef = useRef(null);

  // Form state - single date range + multiple time slots
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [timeSlots, setTimeSlots] = useState([{ id: Date.now(), start_time: "", end_time: "" }]);
  const [reason, setReason] = useState("");
  
  const [errors, setErrors] = useState({});
  const [slotErrors, setSlotErrors] = useState([{}]);
  const [submitting, setSubmitting] = useState(false);

  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);

  const [popupConfig, setPopupConfig] = useState({
    show: false, type: "info", title: "", message: "",
    confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null,
  });

  const openPopup = (cfg) =>
    setPopupConfig({ show: true, type: "info", title: "", message: "", confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null, ...cfg });
  const closePopup = () => setPopupConfig((p) => ({ ...p, show: false }));

  // ── fetch ────────────────────────────────────────────────────────────────
  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/attendance/ot-requests/");
      setMyRequests(res.data?.ot_requests || []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchMyRequests(); }, []);

  const handleToggleList = () => {
    if (!showList) fetchMyRequests();
    setShowList((v) => !v);
  };

  // ── slot handlers ────────────────────────────────────────────────────────
  const updateSlot = (idx, field, value) => {
    setTimeSlots((prev) => {
      const updated = prev.map((s, i) => i === idx ? { ...s, [field]: value } : s);
      return updated;
    });
    setSlotErrors((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: "" } : e));
  };

  const addSlot = () => {
    setTimeSlots((p) => [...p, { id: Date.now() + Math.random(), start_time: "", end_time: "" }]);
    setSlotErrors((p) => [...p, {}]);
  };

  const removeSlot = (idx) => {
    if (timeSlots.length === 1) return;
    setTimeSlots((p) => p.filter((_, i) => i !== idx));
    setSlotErrors((p) => p.filter((_, i) => i !== idx));
  };

  const handleReset = () => {
    openPopup({
      type: "warning", title: "Reset Form",
      message: "Clear all data and start over?",
      showCancel: true, confirmText: "Yes, Reset",
      onConfirm: () => {
        setStartDate(todayStr());
        setEndDate(todayStr());
        setTimeSlots([{ id: Date.now(), start_time: "", end_time: "" }]);
        setReason("");
        setErrors({});
        setSlotErrors([{}]);
        closePopup();
      },
    });
  };

  // ── validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const formErrors = {};
    let valid = true;

    // Date validation
    if (!startDate) { formErrors.start_date = "Start date is required."; valid = false; }
    if (!endDate) { formErrors.end_date = "End date is required."; valid = false; }
    if (startDate && endDate && endDate < startDate) {
      formErrors.end_date = "End date must be ≥ start date.";
      valid = false;
    }

    // Slot validation
    const newSlotErrors = timeSlots.map((slot) => {
      const e = {};
      if (!slot.start_time) { e.start_time = "Required."; valid = false; }
      if (!slot.end_time) { e.end_time = "Required."; valid = false; }
      if (slot.start_time && slot.end_time && slot.start_time >= slot.end_time) {
        e.end_time = "End time must be after start time.";
        valid = false;
      }
      return e;
    });

    // Check for overlapping slots within the request
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        const slot1 = timeSlots[i];
        const slot2 = timeSlots[j];
        if (slot1.start_time && slot1.end_time && slot2.start_time && slot2.end_time) {
          if (slotsOverlap(slot1, slot2)) {
            newSlotErrors[i].overlap = `Overlaps with slot ${j + 1}`;
            newSlotErrors[j].overlap = `Overlaps with slot ${i + 1}`;
            valid = false;
          }
        }
      }
    }

    setErrors(formErrors);
    setSlotErrors(newSlotErrors);
    return valid;
  };

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        start_date: startDate,
        end_date: endDate,
        time_slots: timeSlots.map(({ start_time, end_time }) => ({ start_time, end_time })),
        reason: reason || "",
      };

      await api.post("/api/attendance/ot-requests/submit/", payload);

      openPopup({
        type: "success",
        title: "OT Request Submitted!",
        message: "Your overtime request has been sent for admin review. You'll be notified once reviewed.",
        confirmText: "OK",
        onConfirm: () => {
          setStartDate(todayStr());
          setEndDate(todayStr());
          setTimeSlots([{ id: Date.now(), start_time: "", end_time: "" }]);
          setReason("");
          setErrors({});
          setSlotErrors([{}]);
          fetchMyRequests();
          setShowList(true);
          closePopup();
        },
      });
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : err.response?.data?.message || "Failed to submit OT request.";
      openPopup({ type: "error", title: "Submission Failed", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = myRequests.filter((r) => r.status === "pending").length;

  // Calculate total hours preview
  const days = calcDays(startDate, endDate);
  const dailyHours = timeSlots.reduce((sum, slot) => sum + calcSlotHours(slot.start_time, slot.end_time), 0);
  const totalHours = dailyHours * days;

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <>
      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AutoBreadcrumb />

          <div className="otr-page">

            {/* ══ FORM CARD ════════════════════════════════════════════════ */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <section className="ef-section" ref={formRef}>

                {/* Heading row */}
                <div className="otr-heading-row">
                  <h2 className="ef-heading" style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>
                    <FaClockRotateLeft className="ef-icon" />
                    Request Overtime
                  </h2>
                  <div className="otr-heading-actions">
                    <button
                      type="button"
                      className={`otr-toggle-btn${showList ? " otr-toggle-btn--active" : ""}`}
                      onClick={handleToggleList}
                      title={showList ? "Hide my OT requests" : "View my OT requests"}
                    >
                      <FaListUl />
                      <span className="otr-toggle-label">My Requests</span>
                      {pendingCount > 0 && !showList && (
                        <span className="otr-pending-badge">{pendingCount}</span>
                      )}
                      {showList ? <FaChevronUp className="otr-toggle-chevron" /> : <FaChevronDown className="otr-toggle-chevron" />}
                    </button>
                  </div>
                </div>

                <div className="otr-heading-divider" />

                <form onSubmit={(e) => e.preventDefault()} noValidate>

                  {/* Date Range */}
                  <div className="ef-row otr-mb">
                    <div className="ef-field">
                      <label className="required">OT Start Date</label>
                      <input
                        type="date"
                        name="start_date"
                        value={startDate}
                        min={todayStr()}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (endDate < e.target.value) setEndDate(e.target.value);
                          setErrors((p) => ({ ...p, start_date: "", end_date: "" }));
                        }}
                      />
                      {errors.start_date && <p className="error-message">{errors.start_date}</p>}
                    </div>
                    <div className="ef-field">
                      <label className="required">OT End Date</label>
                      <input
                        type="date"
                        name="end_date"
                        value={endDate}
                        min={startDate || todayStr()}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setErrors((p) => ({ ...p, end_date: "" }));
                        }}
                      />
                      {errors.end_date && <p className="error-message">{errors.end_date}</p>}
                    </div>
                  </div>

                  {/* Days preview */}
                  {days > 0 && (
                    <div className="otr-days-badge otr-mb">
                      <FaCalendarDay className="otr-dur-icon" />
                      {days === 1 ? "Single day" : <><strong>{days}</strong>&nbsp;days selected</>}
                    </div>
                  )}

                  {/* Time Slots Section */}
                  <div className="otr-slots-container">
                    <div className="otr-slots-header">
                      <label className="required">Daily Time Slots</label>
                      <button type="button" className="otr-add-slot-inline" onClick={addSlot}>
                        <FaPlus /> Add Time Slot
                      </button>
                    </div>

                    {timeSlots.map((slot, idx) => {
                      const duration = formatSlotHours(slot.start_time, slot.end_time);
                      const err = slotErrors[idx] || {};

                      return (
                        <div key={slot.id} className="otr-slot-card otr-slot-card--compact">
                          <div className="otr-slot-header">
                            <span className="otr-slot-label">
                              <FaClock className="otr-slot-label-icon" />
                              Slot {idx + 1}
                            </span>
                            {timeSlots.length > 1 && (
                              <button
                                type="button"
                                className="otr-remove-slot-btn"
                                onClick={() => removeSlot(idx)}
                                title="Remove this slot"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>

                          <div className="ef-row otr-mb-sm">
                            <div className="ef-field">
                              <label className="required">Start Time</label>
                              <input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => updateSlot(idx, "start_time", e.target.value)}
                              />
                              {err.start_time && <p className="error-message">{err.start_time}</p>}
                            </div>
                            <div className="ef-field">
                              <label className="required">End Time</label>
                              <input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => updateSlot(idx, "end_time", e.target.value)}
                              />
                              {err.end_time && <p className="error-message">{err.end_time}</p>}
                            </div>
                          </div>

                          {err.overlap && <p className="error-message">{err.overlap}</p>}

                          {duration && (
                            <div className="otr-slot-duration">
                              <FaClock className="otr-dur-icon" />
                              {duration}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Daily hours summary */}
                  {dailyHours > 0 && (
                    <div className="otr-summary-bar otr-mb">
                      <span>
                        Daily OT: <strong>{dailyHours.toFixed(1)}h</strong>
                        {days > 1 && <> · {days} days · Total: <strong>{totalHours.toFixed(1)}h</strong></>}
                      </span>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="ef-field">
                    <label>
                      Reason&nbsp;<span className="ef-optional">(Optional)</span>
                    </label>
                    <textarea
                      name="reason"
                      rows={2}
                      placeholder="Briefly describe why you are doing overtime…"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="ef-form-actions">
                    <button type="button" className="btn btn-back" onClick={handleReset}>
                      <FaRedo /> Reset
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? <span className="otr-spinner" /> : <FaPlus />}
                      {submitting ? "Submitting…" : "Submit Request"}
                    </button>
                  </div>

                </form>
              </section>
            </div>

            {/* ══ SLIDING LIST PANEL ═══════════════════════════════════════ */}
            <div className={`otr-list-panel${showList ? " otr-list-panel--open" : ""}`}>
              <OTRequestList requests={myRequests} loading={loading} onClose={() => setShowList(false)} />
            </div>

          </div>
        </div>
      </main>

      <style>{`
        .otr-page { display: flex; flex-direction: column; gap: 20px; }

        /* heading */
        .otr-heading-row {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px; margin-bottom: 12px;
        }
        .otr-heading-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .otr-heading-divider {
          height: 2px; background: var(--accent, #ff9800);
          margin-bottom: 18px; border-radius: 2px;
        }

        /* ef- pattern */
        .ef-section { width: 100%; }
        .ef-heading {
          font-size: clamp(16px, 3vw, 20px); font-weight: 700;
          color: var(--primary, #0b91ac);
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .ef-icon { color: var(--primary, #0b91ac); }
        .ef-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .ef-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .ef-optional { font-size: 12px; color: #888; font-weight: 400; }
        .ef-section label { font-size: 13px; font-weight: 600; color: #444; }
        .ef-section label.required::after { content: " *"; color: #e53935; }
        .ef-section input,
        .ef-section select,
        .ef-section textarea {
          width: 100% !important; max-width: 100% !important; box-sizing: border-box !important;
        }
        .error-message { font-size: 12px; color: #e53935; margin: 0; }
        .ef-form-actions {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;
          flex-wrap: wrap; gap: 12px;
        }

        /* Slots container */
        .otr-slots-container { margin-bottom: 16px; }
        .otr-slots-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .otr-slots-header label { margin-bottom: 0; }

        /* Slot cards */
        .otr-slot-card {
          border: 1.5px solid #e0e0e0; border-radius: 10px;
          padding: 16px; margin-bottom: 12px;
          background: #fafafa;
          transition: border-color 0.2s;
        }
        .otr-slot-card:hover { border-color: var(--primary, #0b91ac); }
        .otr-slot-card--compact { padding: 12px 16px; }

        .otr-slot-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
        }
        .otr-slot-label {
          display: flex; align-items: center; gap: 7px;
          font-size: 13px; font-weight: 700; color: var(--primary, #0b91ac);
        }
        .otr-slot-label-icon { font-size: 13px; }

        .otr-remove-slot-btn {
          background: none; border: 1px solid #f5c6cb; color: #e53935;
          border-radius: 6px; padding: 5px 8px; cursor: pointer; font-size: 12px;
          display: flex; align-items: center; gap: 4px;
          transition: background 0.15s;
        }
        .otr-remove-slot-btn:hover { background: #fef2f2; }

        .otr-slot-duration {
          display: inline-flex; align-items: center; gap: 6px;
          background: #e8f6f9; color: var(--primary, #0b91ac);
          border-radius: 6px; padding: 4px 12px; font-size: 12px; font-weight: 600;
          margin-top: 8px;
        }

        /* Slots list in drawer */
        .otr-slots-section { margin: 12px 0; }
        .otr-slots-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
        .otr-slot-item {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 12px; background: #f8fafc; border-radius: 6px;
          font-size: 13px;
        }
        .otr-slot-icon { color: var(--primary, #0b91ac); font-size: 12px; }
        .otr-slot-hours { color: #888; font-size: 12px; margin-left: auto; }

        /* Add slot button */
        .otr-add-slot-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 8px; cursor: pointer;
          font-size: 13px; font-weight: 600;
          border: 1.5px dashed var(--primary, #0b91ac);
          color: var(--primary, #0b91ac); background: #e8f6f9;
          transition: background 0.18s;
          white-space: nowrap;
        }
        .otr-add-slot-btn:hover { background: #cceef5; }

        .otr-slot-count-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; padding: 0 5px; border-radius: 20px;
          font-size: 10px; font-weight: 800;
          background: var(--primary, #0b91ac); color: #fff;
        }

        /* summary bar */
        .otr-summary-bar {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
          background: #e8f6f9; border: 1px solid #b2dde8;
          border-radius: 8px; padding: 10px 16px;
          font-size: 13px; color: var(--primary, #0b91ac);
        }
        .otr-add-slot-inline {
          display: inline-flex; align-items: center; gap: 5px;
          background: none; border: 1px solid var(--primary, #0b91ac);
          color: var(--primary, #0b91ac); border-radius: 6px;
          padding: 4px 10px; font-size: 12px; font-weight: 600; cursor: pointer;
        }

        /* toggle button */
        .otr-toggle-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 8px; cursor: pointer;
          font-size: 13px; font-weight: 600;
          border: 1.5px solid var(--primary, #0b91ac);
          color: var(--primary, #0b91ac); background: #fff;
          transition: background 0.18s, color 0.18s; white-space: nowrap;
        }
        .otr-toggle-btn:hover,
        .otr-toggle-btn--active { background: var(--primary, #0b91ac); color: #fff; }
        .otr-toggle-chevron { font-size: 11px; }
        .otr-pending-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; padding: 0 5px; border-radius: 20px;
          font-size: 10px; font-weight: 800; background: #ff9800; color: #fff;
        }

        /* form helpers */
        .otr-mb { margin-bottom: 16px; }
        .otr-mb-sm { margin-bottom: 8px; }
        .otr-duration-badge,
        .otr-days-badge {
          display: inline-flex; align-items: center; gap: 8px;
          border-radius: 8px; padding: 6px 12px; font-size: 13px;
        }
        .otr-duration-badge {
          background: #e8f6f9; color: var(--primary, #0b91ac); border: 1px solid #b2dde8;
        }
        .otr-days-badge {
          background: #fff3e0; color: #e65100; border: 1px solid #ffcc80;
        }
        .otr-dur-icon { font-size: 14px; }
        .otr-sep { color: #aaa; margin: 0 2px; }

        .otr-spinner {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
          border-radius: 50%; animation: otr-spin 0.7s linear infinite;
        }
        .otr-spinner--lg {
          width: 28px; height: 28px; border-color: #e0e0e0;
          border-top-color: var(--primary, #0b91ac);
        }
        @keyframes otr-spin { to { transform: rotate(360deg); } }

        /* sliding panel */
        .otr-list-panel { max-height: 0; overflow: hidden; transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1); }
        .otr-list-panel--open { max-height: 3000px; }

        /* drawer */
        .otr-drawer {
          background: #fff; border-radius: 10px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07); overflow: hidden;
          animation: otr-fade-in 0.2s ease;
        }
        @keyframes otr-fade-in { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

        .otr-drawer-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 2px solid var(--accent, #ff9800);
        }
        .otr-drawer-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 18px; font-weight: 700; color: var(--primary, #0b91ac);
        }
        .otr-count-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 22px; height: 22px; padding: 0 6px; border-radius: 20px;
          font-size: 11px; font-weight: 800;
          background: var(--primary, #0b91ac); color: #fff;
        }
        .otr-drawer-close {
          background: none; border: none; cursor: pointer;
          color: #aaa; font-size: 18px; padding: 4px 6px; border-radius: 6px;
          transition: color 0.15s, background 0.15s; display: flex; align-items: center;
        }
        .otr-drawer-close:hover { color: #e53935; background: #fef2f2; }
        .otr-drawer-body { padding: 20px; }

        /* empty */
        .otr-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 10px; padding: 48px 24px; color: #aaa; text-align: center;
        }
        .otr-empty-icon { font-size: 36px; color: #ddd; }
        .otr-empty p { font-size: 15px; font-weight: 600; color: #bbb; margin: 0; }
        .otr-empty span { font-size: 13px; }

        /* cards */
        .otr-list { display: flex; flex-direction: column; gap: 10px; }
        .otr-card { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; transition: box-shadow 0.2s; }
        .otr-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
        .otr-card-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 16px; cursor: pointer; background: #fafafa;
          user-select: none; gap: 12px;
        }
        .otr-card-left { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; flex: 1; min-width: 0; }
        .otr-status-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 20px;
          font-size: 12px; font-weight: 700; white-space: nowrap; flex-shrink: 0;
        }
        .otr-card-date,
        .otr-card-time { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #444; font-weight: 500; }
        .otr-ic { font-size: 12px; color: #aaa; flex-shrink: 0; }
        .otr-hrs-chip {
          display: inline-block; background: #e8f6f9; color: var(--primary, #0b91ac);
          border-radius: 6px; padding: 1px 8px; font-size: 11px; font-weight: 700; margin-left: 4px;
        }
        .otr-expand-btn {
          background: none; border: none; cursor: pointer;
          color: #aaa; font-size: 13px; padding: 4px; flex-shrink: 0; transition: color 0.2s;
        }
        .otr-expand-btn:hover { color: var(--primary, #0b91ac); }

        .otr-card-body {
          padding: 14px 16px; border-top: 1px solid #f0f0f0; background: #fff;
          animation: otr-slide-in 0.18s ease;
        }
        @keyframes otr-slide-in { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }

        .otr-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 12px; }
        .otr-detail-item { display: flex; flex-direction: column; gap: 3px; }
        .otr-detail-label { font-size: 11px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; }
        .otr-detail-value { font-size: 13px; color: #333; font-weight: 500; }
        .otr-source-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .otr-source-badge--emp { background: #e8f6f9; color: var(--primary, #0b91ac); }

        .otr-reason-box, .otr-remarks-box { padding: 10px 14px; border-radius: 8px; margin-top: 10px; font-size: 13px; }
        .otr-reason-box { background: #f8fafc; border-left: 3px solid #e0e0e0; }
        .otr-remarks-box { background: #f8fafc; border-left: 3px solid #ccc; }
        .otr-reason-box p, .otr-remarks-box p { margin: 4px 0 0; color: #555; line-height: 1.5; }
        .otr-locked-badge {
          margin-top: 12px; display: inline-flex; align-items: center; gap: 6px;
          background: #f0fdf4; color: #22c55e; border: 1px solid #bbf7d0;
          border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 600;
        }

        @media (max-width: 640px) {
          .ef-row { grid-template-columns: 1fr; }
          .otr-card-left { flex-direction: column; align-items: flex-start; }
          .otr-detail-grid { grid-template-columns: 1fr; }
          .otr-toggle-label { display: none; }
          .otr-heading-actions { width: 100%; justify-content: flex-end; }
          .otr-slots-header { flex-direction: column; align-items: flex-start; gap: 10px; }
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

export default OvertimeRequest;