import React, { useState, useEffect } from "react";
import {
  FaUserPlus, FaPlus, FaClock, FaCalendarDay,
  FaUsers, FaUser, FaXmark, FaMagnifyingGlass, FaCircleCheck,
} from "react-icons/fa6";
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

const calcDays = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e - s) / 86400000) + 1;
  return diff > 0 ? diff : 0;
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const fmt12 = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
};

// Check if two time slots overlap
const slotsOverlap = (slot1, slot2) => {
  return slot1.start_time < slot2.end_time && slot2.start_time < slot1.end_time;
};

// ─── Employee Search & Multi-select ─────────────────────────────────────────

const EmployeeSelector = ({ selected, onSelect, onRemove, mode }) => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let timer;
    if (search.trim().length < 1) { setEmployees([]); return; }
    setLoading(true);
    timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/employee/employees/?search=${encodeURIComponent(search)}&page_size=20`);
        const list = res.data?.results || res.data?.employees || res.data || [];
        setEmployees(Array.isArray(list) ? list : []);
      } catch { setEmployees([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const isSelected = (emp) => selected.some((s) => s.id === emp.id);

  const handlePick = (emp) => {
    if (mode === "single") {
      onSelect([emp]);
      setSearch("");
      setOpen(false);
    } else {
      if (isSelected(emp)) onRemove(emp.id);
      else onSelect([...selected, emp]);
    }
  };

  return (
    <div className="ota-emp-selector">
      {selected.length > 0 && (
        <div className="ota-chips">
          {selected.map((emp) => (
            <span key={emp.id} className="ota-chip">
              <FaUser className="ota-chip-icon" />
              {emp.full_name}
              <button type="button" className="ota-chip-remove" onClick={() => onRemove(emp.id)}>
                <FaXmark />
              </button>
            </span>
          ))}
        </div>
      )}

      {(mode === "single" ? selected.length === 0 : true) && (
        <div className="ota-search-wrap">
          <FaMagnifyingGlass className="ota-search-icon" />
          <input
            type="text"
            className="ota-search-input"
            placeholder={mode === "single" ? "Search employee…" : "Search and add employees…"}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 180)}
          />
          {loading && <span className="ota-search-spinner" />}
        </div>
      )}

      {open && employees.length > 0 && (
        <div className="ota-dropdown">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className={`ota-dropdown-item${isSelected(emp) ? " ota-dropdown-item--selected" : ""}`}
              onMouseDown={() => handlePick(emp)}
            >
              <div className="ota-dropdown-avatar">
                {emp.full_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="ota-dropdown-info">
                <span className="ota-dropdown-name">{emp.full_name}</span>
                <span className="ota-dropdown-meta">
                  {emp.employee_id && <>#&nbsp;{emp.employee_id}</>}
                  {emp.designation && <>&ensp;·&ensp;{emp.designation}</>}
                </span>
              </div>
              {isSelected(emp) && <FaCircleCheck className="ota-dropdown-check" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const OTAssign = () => {
  const [mode, setMode] = useState("single");

  // Form state
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [timeSlots, setTimeSlots] = useState([{ id: Date.now(), start_time: "", end_time: "" }]);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState({});
  const [slotErrors, setSlotErrors] = useState([{}]);
  const [selectedEmps, setSelectedEmps] = useState([]);
  const [empError, setEmpError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [popupConfig, setPopupConfig] = useState({
    show: false, type: "info", title: "", message: "",
    confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null,
  });

  const openPopup = (cfg) =>
    setPopupConfig({ show: true, type: "info", title: "", message: "", confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null, ...cfg });
  const closePopup = () => setPopupConfig((p) => ({ ...p, show: false }));

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleModeSwitch = (m) => {
    setMode(m);
    setSelectedEmps([]);
    setEmpError("");
  };

  const removeEmp = (id) => setSelectedEmps((p) => p.filter((e) => e.id !== id));

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

    // Check for overlapping slots
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

    // Employee validation
    let empOk = true;
    if (selectedEmps.length === 0) {
      setEmpError("Please select at least one employee.");
      empOk = false;
    } else {
      setEmpError("");
    }

    return valid && empOk;
  };

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        employee_ids: selectedEmps.map((e) => e.id),
        start_date: startDate,
        end_date: endDate,
        time_slots: timeSlots.map(({ start_time, end_time }) => ({ start_time, end_time })),
        reason: reason,
        notes: notes,
      };

      await api.post("/api/attendance/ot-requests/assign/", payload);

      const names = selectedEmps.map((e) => e.full_name).join(", ");
      openPopup({
        type: "success",
        title: "OT Assigned Successfully!",
        message: `Overtime has been assigned to: ${names}. They will receive an email notification.`,
        confirmText: "OK",
        onConfirm: () => {
          setStartDate(todayStr());
          setEndDate(todayStr());
          setTimeSlots([{ id: Date.now(), start_time: "", end_time: "" }]);
          setReason("");
          setNotes("");
          setSelectedEmps([]);
          setErrors({});
          setSlotErrors([{}]);
          closePopup();
        },
      });
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : err.response?.data?.message || "Failed to assign OT.";
      openPopup({ type: "error", title: "Assignment Failed", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate preview
  const days = calcDays(startDate, endDate);
  const dailyHours = timeSlots.reduce((sum, slot) => sum + calcSlotHours(slot.start_time, slot.end_time), 0);
  const totalHours = dailyHours * days;

  return (
    <>
      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AutoBreadcrumb />

          <div className="bg-white rounded-lg shadow-lg p-6">
            <section className="ef-section">

              {/* Heading */}
              <div className="ota-heading-row">
                <h2 className="ef-heading" style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>
                  <FaUserPlus className="ef-icon" />
                  Assign Overtime
                </h2>
                <div className="ota-mode-toggle">
                  <button
                    type="button"
                    className={`ota-mode-btn${mode === "single" ? " ota-mode-btn--active" : ""}`}
                    onClick={() => handleModeSwitch("single")}
                  >
                    <FaUser /> Single
                  </button>
                  <button
                    type="button"
                    className={`ota-mode-btn${mode === "multi" ? " ota-mode-btn--active" : ""}`}
                    onClick={() => handleModeSwitch("multi")}
                  >
                    <FaUsers /> Multiple
                  </button>
                </div>
              </div>
              <div className="otr-heading-divider" />

              <form onSubmit={(e) => e.preventDefault()} noValidate>

                {/* Employee selection */}
                <div className="ef-field ota-emp-field">
                  <label className="required">
                    {mode === "single" ? "Employee" : "Employees"}
                  </label>
                  <EmployeeSelector
                    selected={selectedEmps}
                    onSelect={setSelectedEmps}
                    onRemove={removeEmp}
                    mode={mode}
                  />
                  {empError && <p className="error-message">{empError}</p>}
                  {mode === "multi" && selectedEmps.length > 0 && (
                    <p className="ota-emp-count">{selectedEmps.length} employee(s) selected</p>
                  )}
                </div>

                {/* Date Range */}
                <div className="ef-row otr-mb">
                  <div className="ef-field">
                    <label className="required">OT Start Date</label>
                    <input
                      type="date"
                      name="start_date"
                      value={startDate}
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

                {days > 0 && (
                  <div className="otr-days-badge otr-mb">
                    <FaCalendarDay className="otr-dur-icon" />
                    {days === 1 ? "Single day" : <><strong>{days}</strong>&nbsp;days</>}
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
                              Remove
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

                {/* Reason & Notes */}
                <div className="ef-row otr-mb">
                  <div className="ef-field">
                    <label>Reason <span className="ef-optional">(Optional)</span></label>
                    <textarea
                      name="reason" rows={2}
                      placeholder="Reason for OT assignment…"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                  <div className="ef-field">
                    <label>Internal Notes <span className="ef-optional">(Optional)</span></label>
                    <textarea
                      name="notes" rows={2}
                      placeholder="Additional notes (not shown to employees)…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Preview card */}
                {selectedEmps.length > 0 && startDate && endDate && dailyHours > 0 && (
                  <div className="ota-preview-card otr-mb">
                    <div className="ota-preview-title">Assignment Preview</div>
                    <div className="ota-preview-grid">
                      <div className="ota-preview-item">
                        <span className="ota-preview-label">Employees</span>
                        <span className="ota-preview-value">{selectedEmps.length}</span>
                      </div>
                      <div className="ota-preview-item">
                        <span className="ota-preview-label">Period</span>
                        <span className="ota-preview-value">{fmtDate(startDate)} → {fmtDate(endDate)}</span>
                      </div>
                      <div className="ota-preview-item">
                        <span className="ota-preview-label">Time Slots</span>
                        <span className="ota-preview-value">
                          {timeSlots.map((s, i) => (
                            <span key={i}>{fmt12(s.start_time)}–{fmt12(s.end_time)}{i < timeSlots.length - 1 ? ", " : ""}</span>
                          ))}
                        </span>
                      </div>
                      <div className="ota-preview-item">
                        <span className="ota-preview-label">Daily OT</span>
                        <span className="ota-preview-value">{dailyHours.toFixed(1)}h</span>
                      </div>
                      {days > 1 && (
                        <div className="ota-preview-item">
                          <span className="ota-preview-label">Total Days</span>
                          <span className="ota-preview-value">{days}</span>
                        </div>
                      )}
                      {totalHours > 0 && (
                        <div className="ota-preview-item">
                          <span className="ota-preview-label">Total Hours</span>
                          <span className="ota-preview-value">{totalHours.toFixed(1)}h</span>
                        </div>
                      )}
                    </div>
                    <p className="ota-preview-note">
                      ✉️ Each employee will receive an email notification immediately upon assignment.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="ef-form-actions">
                  <button
                    type="button"
                    className="btn btn-back"
                    onClick={() => {
                      setStartDate(todayStr());
                      setEndDate(todayStr());
                      setTimeSlots([{ id: Date.now(), start_time: "", end_time: "" }]);
                      setReason("");
                      setNotes("");
                      setSelectedEmps([]);
                      setErrors({});
                      setSlotErrors([{}]);
                      setEmpError("");
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? <span className="otr-spinner" /> : <FaPlus />}
                    {submitting
                      ? "Assigning…"
                      : selectedEmps.length > 1
                        ? `Assign to ${selectedEmps.length} Employees`
                        : "Assign OT"}
                  </button>
                </div>

              </form>
            </section>
          </div>
        </div>
      </main>

      <style>{`
        .otr-heading-divider { height:2px; background:var(--accent,#ff9800); margin-bottom:18px; border-radius:2px; }
        .ef-section { width:100%; }
        .ef-heading { font-size:clamp(16px,3vw,20px); font-weight:700; color:var(--primary,#0b91ac); display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .ef-icon { color:var(--primary,#0b91ac); }
        .ef-row { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
        .ef-field { display:flex; flex-direction:column; gap:5px; min-width:0; }
        .ef-optional { font-size:12px; color:#888; font-weight:400; }
        .ef-section label { font-size:13px; font-weight:600; color:#444; }
        .ef-section label.required::after { content:" *"; color:#e53935; }
        .ef-section input,.ef-section select,.ef-section textarea { width:100%!important; max-width:100%!important; box-sizing:border-box!important; }
        .error-message { font-size:12px; color:#e53935; margin:0; }
        .ef-form-actions { display:flex; justify-content:space-between; align-items:center; margin-top:24px; padding-top:16px; border-top:1px solid #eee; flex-wrap:wrap; gap:12px; }

        .ota-heading-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:12px; }

        .ota-mode-toggle { display:flex; border:1.5px solid var(--primary,#0b91ac); border-radius:8px; overflow:hidden; }
        .ota-mode-btn {
          display:flex; align-items:center; gap:6px;
          padding:7px 16px; font-size:13px; font-weight:600; cursor:pointer;
          background:#fff; border:none; color:var(--primary,#0b91ac);
          transition:background 0.18s,color 0.18s;
        }
        .ota-mode-btn + .ota-mode-btn { border-left:1.5px solid var(--primary,#0b91ac); }
        .ota-mode-btn--active { background:var(--primary,#0b91ac); color:#fff; }

        .ota-emp-field { margin-bottom:20px; position:relative; }
        .ota-emp-selector { display:flex; flex-direction:column; gap:8px; }
        .ota-chips { display:flex; flex-wrap:wrap; gap:6px; }
        .ota-chip {
          display:inline-flex; align-items:center; gap:5px;
          background:#e8f6f9; color:var(--primary,#0b91ac);
          border:1px solid #b2dde8; border-radius:20px;
          padding:4px 10px; font-size:12px; font-weight:600;
        }
        .ota-chip-icon { font-size:11px; }
        .ota-chip-remove {
          background:none; border:none; cursor:pointer;
          color:#aaa; font-size:11px; padding:0; display:flex; align-items:center;
          margin-left:3px; transition:color 0.15s;
        }
        .ota-chip-remove:hover { color:#e53935; }

        .ota-search-wrap { position:relative; display:flex; align-items:center; }
        .ota-search-icon { position:absolute; left:10px; color:#aaa; font-size:13px; pointer-events:none; }
        .ota-search-input {
          width:100%; padding:9px 12px 9px 32px;
          border:1.5px solid #d1d5db; border-radius:8px;
          font-size:13px; outline:none; box-sizing:border-box;
          transition:border-color 0.18s;
        }
        .ota-search-input:focus { border-color:var(--primary,#0b91ac); }
        .ota-search-spinner {
          position:absolute; right:10px;
          width:14px; height:14px;
          border:2px solid #e0e0e0; border-top-color:var(--primary,#0b91ac);
          border-radius:50%; animation:otr-spin 0.7s linear infinite;
        }

        .ota-dropdown {
          position:absolute; top:calc(100% + 4px); left:0; right:0; z-index:100;
          background:#fff; border:1.5px solid #e0e0e0; border-radius:10px;
          box-shadow:0 4px 20px rgba(0,0,0,0.1); max-height:260px; overflow-y:auto;
          animation:otr-fade-in 0.15s ease;
        }
        .ota-dropdown-item {
          display:flex; align-items:center; gap:10px; padding:10px 14px;
          cursor:pointer; transition:background 0.12s;
        }
        .ota-dropdown-item:hover { background:#f0f9fb; }
        .ota-dropdown-item--selected { background:#e8f6f9; }
        .ota-dropdown-avatar {
          width:32px; height:32px; border-radius:50%; flex-shrink:0;
          background:var(--primary,#0b91ac); color:#fff;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:700;
        }
        .ota-dropdown-info { display:flex; flex-direction:column; gap:2px; flex:1; min-width:0; }
        .ota-dropdown-name { font-size:13px; font-weight:600; color:#333; }
        .ota-dropdown-meta { font-size:11px; color:#aaa; }
        .ota-dropdown-check { color:var(--primary,#0b91ac); font-size:15px; flex-shrink:0; }

        .ota-emp-count { font-size:12px; color:var(--primary,#0b91ac); font-weight:600; margin:0; }

        /* Slots container */
        .otr-slots-container { margin-bottom:16px; }
        .otr-slots-header {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:12px;
        }
        .otr-slots-header label { margin-bottom:0; }

        .otr-slot-card {
          border:1.5px solid #e0e0e0; border-radius:10px;
          padding:16px; margin-bottom:12px;
          background:#fafafa;
          transition:border-color 0.2s;
        }
        .otr-slot-card:hover { border-color:var(--primary,#0b91ac); }
        .otr-slot-card--compact { padding:12px 16px; }

        .otr-slot-header {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:14px;
        }
        .otr-slot-label {
          display:flex; align-items:center; gap:7px;
          font-size:13px; font-weight:700; color:var(--primary,#0b91ac);
        }
        .otr-slot-label-icon { font-size:13px; }

        .otr-remove-slot-btn {
          background:none; border:1px solid #f5c6cb; color:#e53935;
          border-radius:6px; padding:5px 8px; cursor:pointer; font-size:12px;
          display:flex; align-items:center; gap:4px;
          transition:background 0.15s;
        }
        .otr-remove-slot-btn:hover { background:#fef2f2; }

        .otr-slot-duration {
          display:inline-flex; align-items:center; gap:6px;
          background:#e8f6f9; color:var(--primary,#0b91ac);
          border-radius:6px; padding:4px 12px; font-size:12px; font-weight:600;
          margin-top:8px;
        }

        .otr-mb { margin-bottom:20px; }
        .otr-mb-sm { margin-bottom:8px; }
        .otr-duration-badge,.otr-days-badge { display:inline-flex; align-items:center; gap:8px; border-radius:8px; padding:8px 14px; font-size:13px; }
        .otr-duration-badge { background:#e8f6f9; color:var(--primary,#0b91ac); border:1px solid #b2dde8; }
        .otr-days-badge { background:#fff3e0; color:#e65100; border:1px solid #ffcc80; }
        .otr-dur-icon { font-size:14px; }

        .otr-summary-bar {
          display:flex; align-items:center; justify-content:space-between;
          flex-wrap:wrap; gap:10px;
          background:#e8f6f9; border:1px solid #b2dde8;
          border-radius:8px; padding:10px 16px;
          font-size:13px; color:var(--primary,#0b91ac);
        }
        .otr-add-slot-inline {
          display:inline-flex; align-items:center; gap:5px;
          background:none; border:1px solid var(--primary,#0b91ac);
          color:var(--primary,#0b91ac); border-radius:6px;
          padding:4px 10px; font-size:12px; font-weight:600; cursor:pointer;
        }

        .otr-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:otr-spin 0.7s linear infinite; }
        @keyframes otr-spin { to { transform:rotate(360deg); } }
        @keyframes otr-fade-in { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

        .ota-preview-card {
          border:1.5px solid #b2dde8; background:#e8f6f9; border-radius:10px; padding:16px;
        }
        .ota-preview-title { font-size:12px; font-weight:700; color:var(--primary,#0b91ac); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px; }
        .ota-preview-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px 20px; margin-bottom:10px; }
        .ota-preview-item { display:flex; flex-direction:column; gap:3px; }
        .ota-preview-label { font-size:11px; font-weight:700; color:#7fbfcc; text-transform:uppercase; letter-spacing:0.5px; }
        .ota-preview-value { font-size:13px; font-weight:600; color:#0b5f72; }
        .ota-preview-note { font-size:12px; color:#0b6d84; margin:0; padding-top:10px; border-top:1px solid #b2dde8; }

        @media(max-width:640px) {
          .ef-row { grid-template-columns:1fr; }
          .ota-heading-row { flex-direction:column; align-items:flex-start; }
          .otr-slots-header { flex-direction:column; align-items:flex-start; gap:10px; }
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

export default OTAssign;