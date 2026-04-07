import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaSave } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

/* ── Auto-calculate working hours ── */
const calculateWorkingHours = (start, end, breakHours = 1) => {
  if (!start || !end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let startDate = new Date(0, 0, 0, sh, sm);
  let endDate   = new Date(0, 0, 0, eh, em);
  if (endDate < startDate) endDate.setDate(endDate.getDate() + 1); // night shift
  const diff = (endDate - startDate) / (1000 * 60 * 60);
  const result = diff - breakHours;
  return result > 0 ? result.toFixed(2) : "";
};

const EditShiftPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    start_time: "",
    end_time: "",
    working_hours: "",
    break_hours: 1, // ✅ always sent, never shown in UI
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [popup, setPopup] = useState({
    show: false, type: "info", title: "", message: "", onConfirm: null,
  });
  const showPopup  = (type, title, message, onConfirm = null) =>
    setPopup({ show: true, type, title, message, onConfirm });
  const closePopup = () =>
    setPopup({ show: false, type: "info", title: "", message: "", onConfirm: null });
  const handleConfirm = () => { popup.onConfirm?.(); closePopup(); };

  /* ── Fetch existing shift ── */
  useEffect(() => {
    const fetchShift = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/employees/shifts/${id}/`);
        const s = res.data;
        setFormData({
          name:          s.name          || "",
          start_time:    s.start_time?.slice(0, 5) || "",  // "HH:MM:SS" → "HH:MM"
          end_time:      s.end_time?.slice(0, 5)   || "",
          working_hours: s.working_hours || "",
          break_hours:   s.break_hours   || 1,              // ✅ preserve from backend
        });
      } catch {
        showPopup("error", "Error", "Failed to load shift data.");
      } finally {
        setLoading(false);
      }
    };
    fetchShift();
  }, [id]);

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!formData.name.trim())  e.name       = "Shift name is required";
    if (!formData.start_time)   e.start_time = "Start time is required";
    if (!formData.end_time)     e.end_time   = "End time is required";
    if (!formData.working_hours || Number(formData.working_hours) <= 0)
                                e.working_hours = "Select valid start & end times";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Handle change with auto working_hours ── */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "start_time" || name === "end_time") {
      const newStart = name === "start_time" ? value : formData.start_time;
      const newEnd   = name === "end_time"   ? value : formData.end_time;
      const hours    = calculateWorkingHours(newStart, newEnd, formData.break_hours);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        working_hours: hours || prev.working_hours,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { formRef.current?.scrollIntoView({ behavior: "smooth" }); return; }

    setSubmitting(true);
    try {
      await api.patch(`/api/employees/shifts/${id}/`, formData);
      showPopup("success", "Updated", "Shift updated successfully.", () => {
        navigate("/shifts/all");
      });
    } catch {
      showPopup("error", "Error", "Failed to update shift. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <main className="app-main">
        <div className="cf-page-wrapper">
          <AutoBreadcrumb />

          <div className="cf-card">
            <section ref={formRef}>

              <div className="cf-form-header">
                <h2 className="cf-form-title">
                  <FaEdit className="domain-icon" />
                  Edit Shift
                </h2>
              </div>

              {loading ? (
                <div className="es-skeleton-wrap">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="es-skeleton-row" />
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>

                  {/* Row 1: Name & Working Hours (read-only, auto-filled) */}
                  <div className="cf-row">
                    <div className="cf-field">
                      <label className="required">Shift Name</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="e.g. Morning Shift"
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? "is-invalid" : ""}
                      />
                      {errors.name && <p className="error-message">{errors.name}</p>}
                    </div>

                    <div className="cf-field">
                      <label>Working Hours</label>
                      <input
                        type="text"
                        name="working_hours"
                        value={
                          formData.working_hours
                            ? `${formData.working_hours} hrs`
                            : ""
                        }
                        readOnly
                        placeholder="Auto-calculated from times"
                        className={`cf-readonly ${errors.working_hours ? "is-invalid" : ""}`}
                      />
                      {errors.working_hours && (
                        <p className="error-message">{errors.working_hours}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Start & End Time */}
                  <div className="cf-row">
                    <div className="cf-field">
                      <label className="required">Start Time</label>
                      <input
                        type="time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleChange}
                        className={errors.start_time ? "is-invalid" : ""}
                      />
                      {errors.start_time && <p className="error-message">{errors.start_time}</p>}
                    </div>

                    <div className="cf-field">
                      <label className="required">End Time</label>
                      <input
                        type="time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleChange}
                        className={errors.end_time ? "is-invalid" : ""}
                      />
                      {errors.end_time && <p className="error-message">{errors.end_time}</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="cf-actions">
                    <button
                      type="submit"
                      className="btn btn-secondary"
                      disabled={submitting}
                    >
                      <FaSave /> {submitting ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-back"
                      onClick={() => navigate("/shifts/all")}
                    >
                      Cancel
                    </button>
                  </div>

                </form>
              )}
            </section>
          </div>
        </div>
      </main>

      <style>{`
        .cf-page-wrapper {
          width: 100%;
          max-width: 900px;
          margin-inline: auto;
          padding: 8px 16px 40px;
          box-sizing: border-box;
        }
        .cf-card {
          width: 100%;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.05);
          padding: 32px;
          box-sizing: border-box;
        }
        .cf-form-header {
          padding-bottom: 14px;
          border-bottom: 2px solid var(--accent, #ff9800);
          margin-bottom: 28px;
        }
        .cf-form-title {
          font-size: clamp(16px, 3vw, 22px);
          font-weight: 700;
          color: var(--primary, #0b91ac);
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }
        .cf-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .cf-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }
        .cf-field input {
          width: 100%;
          box-sizing: border-box;
        }
        .cf-readonly {
          background: #f8fafc !important;
          color: #374151 !important;
          cursor: default !important;
          font-weight: 600;
        }
        .cf-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
        }

        /* Skeleton */
        .es-skeleton-wrap { padding: 8px 0; }
        .es-skeleton-row {
          height: 52px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: es-shimmer 1.4s infinite;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        @keyframes es-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 767px) {
          .cf-page-wrapper { padding: 6px 10px 32px; }
          .cf-card { padding: 18px; border-radius: 12px; }
          .cf-row { grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; }
        }
        @media (max-width: 479px) {
          .cf-card { padding: 14px; border-radius: 10px; }
          .cf-actions { flex-direction: column; }
          .cf-actions .btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <Popup
        show={popup.show} type={popup.type} title={popup.title} message={popup.message}
        onClose={closePopup} onConfirm={handleConfirm}
        confirmText="OK" cancelText="Cancel" showCancel={false}
      />
    </>
  );
};

export default EditShiftPage;