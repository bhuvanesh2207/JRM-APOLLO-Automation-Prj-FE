import React, { useState, useRef } from "react";
import { FaCalendarAlt, FaPaperPlane, FaRedo, FaInfoCircle } from "react-icons/fa";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const LeaveRequestForm = () => {
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    reason: "",
    leave_type: "CASUAL",
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState(0);

  const [popup, setPopup] = useState({
    show: false, type: "info", title: "", message: "", onConfirm: null,
  });
  
  const showPopup = (type, title, message, onConfirm = null) =>
    setPopup({ show: true, type, title, message, onConfirm });
  const closePopup = () =>
    setPopup({ show: false, type: "info", title: "", message: "", onConfirm: null });
  const handleConfirm = () => { popup.onConfirm?.(); closePopup(); };

  /* ── Calculate number of days between dates ── */
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate > endDate) return 0;
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  /* ── Handle date changes and auto-calculate days ── */
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    
    if (name === "start_date" || name === "end_date") {
      const days = calculateDays(
        name === "start_date" ? value : formData.start_date,
        name === "end_date" ? value : formData.end_date
      );
      setCalculatedDays(days);
    }
    
    setFormData(newFormData);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /* ── Handle input changes ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!formData.start_date) e.start_date = "Start date is required";
    if (!formData.end_date) e.end_date = "End date is required";
    if (!formData.reason?.trim()) e.reason = "Reason is required";
    if (!formData.leave_type) e.leave_type = "Leave type is required";
    
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        e.start_date = "Start date cannot be in the past";
      }
      
      if (startDate > endDate) {
        e.end_date = "End date must be after start date";
      }
      
      // Optional: Limit max days (e.g., 30 days max)
      const days = calculateDays(formData.start_date, formData.end_date);
      if (days > 30) {
        e.end_date = "Leave cannot exceed 30 days at once";
      }
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit leave request ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    
    setLoading(true);
    try {
      await api.post("/api/attendance/leaves/request/", formData);
      showPopup("success", "Success", "Leave request submitted successfully!", handleReset);
    } catch (error) {
      console.error("Leave request error:", error);
      const message = error.response?.data?.message || "Failed to submit leave request. Please try again.";
      showPopup("error", "Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      start_date: "",
      end_date: "",
      reason: "",
      leave_type: "CASUAL",
    });
    setCalculatedDays(0);
    setErrors({});
    closePopup();
  };

  /* ── Get leave type display name ── */
  const getLeaveTypeName = (type) => {
    const types = {
      CASUAL: "Casual Leave",
      SICK: "Sick Leave",
      EARNED: "Earned Leave",
      UNPAID: "Unpaid Leave",
    };
    return types[type] || type;
  };

  return (
    <>
      <main className="app-main">
        <div className="cf-page-wrapper">
          <AutoBreadcrumb />

          <div className="cf-card">
            <section ref={formRef}>

              {/* Header */}
              <div className="cf-form-header">
                <h2 className="cf-form-title">
                  <FaCalendarAlt className="domain-icon" />
                  Apply for Leave
                </h2>
                <p className="cf-form-subtitle">
                  Fill in the details below to submit your leave request
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>

                {/* Row 1: Leave Type & Days (calculated) */}
                <div className="cf-row">
                  <div className="cf-field">
                    <label className="required">Leave Type</label>
                    <select
                      name="leave_type"
                      value={formData.leave_type}
                      onChange={handleChange}
                      className={errors.leave_type ? "is-invalid" : ""}
                    >
                      <option value="CASUAL">Casual Leave</option>
                      <option value="SICK">Sick Leave</option>
                      <option value="EARNED">Earned Leave</option>
                      <option value="UNPAID">Unpaid Leave</option>
                    </select>
                    {errors.leave_type && <p className="error-message">{errors.leave_type}</p>}
                  </div>

                  <div className="cf-field">
                    <label>Total Days</label>
                    <input
                      type="text"
                      value={calculatedDays > 0 ? `${calculatedDays} day(s)` : "Select dates"}
                      readOnly
                      className="cf-readonly"
                    />
                    {calculatedDays > 0 && (
                      <small className="cf-hint">
                        <FaInfoCircle /> Total leave days requested
                      </small>
                    )}
                  </div>
                </div>

                {/* Row 2: Start Date & End Date */}
                <div className="cf-row">
                  <div className="cf-field">
                    <label className="required">Start Date</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleDateChange}
                      min={new Date().toISOString().split("T")[0]}
                      className={errors.start_date ? "is-invalid" : ""}
                    />
                    {errors.start_date && <p className="error-message">{errors.start_date}</p>}
                  </div>

                  <div className="cf-field">
                    <label className="required">End Date</label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleDateChange}
                      min={formData.start_date || new Date().toISOString().split("T")[0]}
                      className={errors.end_date ? "is-invalid" : ""}
                    />
                    {errors.end_date && <p className="error-message">{errors.end_date}</p>}
                  </div>
                </div>

                {/* Row 3: Reason (Full width) */}
                <div className="cf-row-single">
                  <div className="cf-field">
                    <label className="required">Reason for Leave</label>
                    <textarea
                      name="reason"
                      rows="4"
                      placeholder="Please provide a detailed reason for your leave request..."
                      value={formData.reason}
                      onChange={handleChange}
                      className={errors.reason ? "is-invalid" : ""}
                    />
                    {errors.reason && <p className="error-message">{errors.reason}</p>}
                    <small className="cf-hint">
                      <FaInfoCircle /> Be specific about the reason for faster approval
                    </small>
                  </div>
                </div>

                {/* Leave Summary Card */}
                {formData.start_date && formData.end_date && calculatedDays > 0 && (
                  <div className="cf-summary">
                    <h4>Leave Summary</h4>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span className="summary-label">Leave Type:</span>
                        <span className="summary-value">{getLeaveTypeName(formData.leave_type)}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Duration:</span>
                        <span className="summary-value">
                          {new Date(formData.start_date).toLocaleDateString()} → {new Date(formData.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Total Days:</span>
                        <span className="summary-value highlight">{calculatedDays} day(s)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="cf-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <FaPaperPlane /> {loading ? "Submitting..." : "Submit Request"}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleReset}>
                    <FaRedo /> Reset
                  </button>
                </div>

              </form>
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
          margin: 0 0 8px 0;
        }
        
        .cf-form-subtitle {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
        
        .cf-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .cf-row-single {
          margin-bottom: 20px;
        }
        
        .cf-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }
        
        .cf-field input,
        .cf-field select,
        .cf-field textarea {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        
        .cf-field input:focus,
        .cf-field select:focus,
        .cf-field textarea:focus {
          outline: none;
          border-color: var(--primary, #0b91ac);
          box-shadow: 0 0 0 3px rgba(11, 145, 172, 0.1);
        }
        
        .cf-field input.is-invalid,
        .cf-field select.is-invalid,
        .cf-field textarea.is-invalid {
          border-color: #f44336;
        }
        
        .cf-readonly {
          background: #f8fafc !important;
          color: #374151 !important;
          cursor: default !important;
          font-weight: 600;
        }
        
        .cf-hint {
          font-size: 12px;
          color: #888;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
        }
        
        .error-message {
          color: #f44336;
          font-size: 12px;
          margin: 4px 0 0 0;
        }
        
        .cf-summary {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          border-left: 4px solid var(--accent, #ff9800);
        }
        
        .cf-summary h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--primary, #0b91ac);
        }
        
        .summary-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }
        
        .summary-label {
          font-weight: 600;
          color: #555;
        }
        
        .summary-value {
          color: #333;
        }
        
        .summary-value.highlight {
          color: var(--accent, #ff9800);
          font-weight: 700;
          font-size: 16px;
        }
        
        .cf-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid var(--neutral-100, #f1f5f9);
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, var(--primary, #0b91ac) 0%, #0a7a91 100%);
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(11, 145, 172, 0.3);
        }
        
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          background: #f5f5f5;
          color: #666;
          border: 1px solid #ddd;
        }
        
        .btn-secondary:hover {
          background: #e8e8e8;
          transform: translateY(-1px);
        }
        
        .required::after {
          content: " *";
          color: #f44336;
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
          .summary-item { flex-direction: column; align-items: flex-start; gap: 4px; }
        }
      `}</style>

      <Popup
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
        onConfirm={handleConfirm}
        confirmText="OK"
        cancelText="Cancel"
        showCancel={false}
      />
    </>
  );
};

export default LeaveRequestForm;