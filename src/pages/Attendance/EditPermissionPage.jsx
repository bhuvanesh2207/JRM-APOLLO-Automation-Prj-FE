import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaClipboardList } from "react-icons/fa";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

/* ── Auto-calc duration ── */
const calcDuration = (start, end) => {
  if (!start || !end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return "";
  return (mins / 60).toFixed(2);
};

/* ════════════════════════════════════════════════════════════ */
const EditPermissionPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [form,      setForm]      = useState(null);   // null = still loading
  const [errors,    setErrors]    = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [fetchErr,  setFetchErr]  = useState("");

  const [popupConfig, setPopupConfig] = useState({
    show: false, type: "info", title: "", message: "",
    confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null,
  });
  const openPopup  = (cfg) => setPopupConfig({ show:true, type:"info", title:"", message:"", confirmText:"OK", cancelText:"Cancel", showCancel:false, onConfirm:null, ...cfg });
  const closePopup = ()    => setPopupConfig((p) => ({ ...p, show:false }));

  /* ── Fetch employees & existing permission in parallel ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [empRes, permRes] = await Promise.all([
          api.get("/api/employees/list/"),
          api.get(`/api/attendance/permissions/${id}/`),
        ]);

        if (empRes.data.success) setEmployees(empRes.data.employees || []);

        const perm = permRes.data.permission || permRes.data;
        setForm({
          employee:   perm.employee?.id ?? perm.employee ?? "",
          date:       perm.date        ?? "",
          start_time: perm.start_time?.slice(0, 5) ?? "",
          end_time:   perm.end_time?.slice(0, 5)   ?? "",
          duration:   perm.duration    ?? "",
          reason:     perm.reason      ?? "",
          status:     perm.status      ?? "pending",
        });
        setFetchErr("");
      } catch {
        setFetchErr("Failed to load permission details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── Field change ── */
  const handleChange = (field, val) => {
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
    setErrors((e) => ({ ...e, [field]: "" }));
  };

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
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await api.put(`/api/attendance/permissions/${id}/edit/`, {
        employee:   form.employee,
        date:       form.date,
        start_time: form.start_time,
        end_time:   form.end_time,
        duration:   form.duration || null,
        reason:     form.reason,
        status:     form.status,
      });
      openPopup({
        type: "success", title: "Updated",
        message: "Permission updated successfully.",
        onConfirm: () => navigate("/attendance/permissions"),
      });
    } catch (err) {
      const msg = err?.response?.data?.errors
        ? JSON.stringify(err.response.data.errors)
        : "Server error. Please try again.";
      openPopup({ type: "error", title: "Error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  /* ── Render: loading / error states ── */
  if (loading) {
    return (
      <main className="app-main">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AutoBreadcrumb />
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="no-data">Loading permission details...</div>
          </div>
        </div>
      </main>
    );
  }

  if (fetchErr) {
    return (
      <main className="app-main">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AutoBreadcrumb />
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div style={{ color:"var(--error)", textAlign:"center", padding:"32px 0" }}>{fetchErr}</div>
            <div style={{ textAlign:"center" }}>
              <button className="btn btn-secondary" onClick={() => navigate("/attendance/permissions")}>
                Back to Permissions
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── Main form ── */
  return (
    <main className="app-main">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AutoBreadcrumb />
        <div className="bg-white rounded-lg shadow-lg p-6">

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ display:"flex", alignItems:"center", gap:8, fontSize:20, fontWeight:700, color:"#1e293b", margin:0 }}>
              <FaClipboardList style={{ color:"#0b91ac" }} />
              Edit Permission
            </h2>
            <p style={{ color:"#64748b", fontSize:13.5, margin:"6px 0 0" }}>
              Update the details for this permission request.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="pf-grid">

              {/* Employee */}
              <div className="pf-field">
                <label className="pf-label">Employee <span className="pf-req">*</span></label>
                <select
                  value={form.employee}
                  onChange={(e) => handleChange("employee", e.target.value)}
                  className={`pf-input${errors.employee ? " pf-input-err" : ""}`}
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
                {errors.employee && <span className="pf-err">{errors.employee}</span>}
              </div>

              {/* Date */}
              <div className="pf-field">
                <label className="pf-label">Date <span className="pf-req">*</span></label>
                <input
                  type="date" value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  className={`pf-input${errors.date ? " pf-input-err" : ""}`}
                />
                {errors.date && <span className="pf-err">{errors.date}</span>}
              </div>

              {/* Start Time */}
              <div className="pf-field">
                <label className="pf-label">Start Time <span className="pf-req">*</span></label>
                <input
                  type="time" value={form.start_time}
                  onChange={(e) => handleChange("start_time", e.target.value)}
                  className={`pf-input${errors.start_time ? " pf-input-err" : ""}`}
                />
                {errors.start_time && <span className="pf-err">{errors.start_time}</span>}
              </div>

              {/* End Time */}
              <div className="pf-field">
                <label className="pf-label">End Time <span className="pf-req">*</span></label>
                <input
                  type="time" value={form.end_time}
                  onChange={(e) => handleChange("end_time", e.target.value)}
                  className={`pf-input${errors.end_time ? " pf-input-err" : ""}`}
                />
                {errors.end_time && <span className="pf-err">{errors.end_time}</span>}
              </div>

              {/* Duration — auto-calculated, read-only */}
              <div className="pf-field">
                <label className="pf-label">Duration (hrs)</label>
                <input
                  type="text" value={form.duration} readOnly
                  placeholder="Auto-calculated"
                  className="pf-input pf-input-readonly"
                />
                <span className="pf-hint">Calculated from start &amp; end time</span>
              </div>

              {/* Status */}
              <div className="pf-field">
                <label className="pf-label">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="pf-input"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Reason — full width */}
              <div className="pf-field pf-field-full">
                <label className="pf-label">Reason <span className="pf-req">*</span></label>
                <textarea
                  rows={4} value={form.reason}
                  onChange={(e) => handleChange("reason", e.target.value)}
                  placeholder="Enter the reason for this permission request..."
                  className={`pf-input${errors.reason ? " pf-input-err" : ""}`}
                  style={{ resize:"vertical" }}
                />
                {errors.reason && <span className="pf-err">{errors.reason}</span>}
              </div>

            </div>

            {/* Actions */}
            <div className="pf-actions">
              <button
                type="button"
                className="btn btn-outline-gray"
                onClick={() => navigate("/attendance/permissions")}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-secondary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .pf-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .pf-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .pf-field-full {
          grid-column: 1 / -1;
        }
        .pf-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        .pf-req { color: #dc2626; }
        .pf-input {
          border: 1px solid #d1d5db;
          border-radius: 7px;
          padding: 9px 11px;
          font-size: 13.5px;
          color: #1e293b;
          background: #fff;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
          box-sizing: border-box;
        }
        .pf-input:focus {
          border-color: #0b91ac;
          box-shadow: 0 0 0 3px rgba(11,145,172,0.12);
        }
        .pf-input-err     { border-color: #dc2626 !important; }
        .pf-input-readonly {
          background: #f9fafb;
          color: #6b7280;
          cursor: default;
        }
        .pf-err  { font-size: 11.5px; color: #dc2626; }
        .pf-hint { font-size: 11.5px; color: #9ca3af; }

        .pf-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .btn-outline-gray {
          background: #fff;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 9px 20px;
          border-radius: 7px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-outline-gray:hover:not(:disabled) { background: #f9fafb; }
        .btn-outline-gray:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary:disabled    { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 560px) {
          .pf-grid { grid-template-columns: 1fr; }
          .pf-field-full { grid-column: 1; }
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

export default EditPermissionPage;