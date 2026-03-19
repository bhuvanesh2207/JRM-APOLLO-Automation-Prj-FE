import React, { useState, useRef, useEffect } from "react";
import { FaPlusCircle, FaSave, FaRedo } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const ClientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: "", contact: "", email: "", company_name: "", address: "",
  });
  const [errors, setErrors] = useState({});

  const [popup, setPopup] = useState({
    show: false, type: "info", title: "", message: "", onConfirm: null,
  });
  const showPopup = (type, title, message, onConfirm = null) =>
    setPopup({ show: true, type, title, message, onConfirm });
  const closePopup = () =>
    setPopup({ show: false, type: "info", title: "", message: "", onConfirm: null });
  const handleConfirm = () => { popup.onConfirm?.(); closePopup(); };

  /* ── Load for edit mode ── */
  useEffect(() => { if (isEditMode) fetchClient(); }, [id]);

  const fetchClient = async () => {
    try {
      const res = await api.get(`/api/client/${id}/`);
      setFormData({
        name: res.data.name || "",
        contact: res.data.contact || "",
        email: res.data.email || "",
        company_name: res.data.company_name || "",
        address: res.data.address || "",
      });
    } catch { showPopup("error", "Error", "Failed to load client details."); }
  };

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!formData.name.trim())         e.name         = "Name is required";
    if (!formData.company_name.trim()) e.company_name = "Company name is required";
    if (!formData.contact.trim())      e.contact      = "Contact number is required";
    if (!formData.email.trim())        e.email        = "Email is required";
    if (!formData.address.trim())      e.address      = "Address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { formRef.current?.scrollIntoView({ behavior: "smooth" }); return; }
    try {
      if (isEditMode) {
        await api.put(`/api/client/update/${id}/`, formData);
        showPopup("success", "Success", "Client updated successfully.", () => navigate("/client/all"));
      } else {
        await api.post("/api/client/add/", formData);
        showPopup("success", "Success", "Client created successfully.", () => navigate("/client/all"));
      }
    } catch { showPopup("error", "Error", "Failed to save client."); }
  };

  const handleReset = () => {
    setFormData({ name: "", contact: "", email: "", company_name: "", address: "" });
    setErrors({});
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
                  <FaPlusCircle className="domain-icon" />
                  {isEditMode ? "Edit Client" : "Add New Client"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} noValidate>

                {/* Row 1: Name & Company */}
                <div className="cf-row">
                  <div className="cf-field">
                    <label className="required">Name</label>
                    <input
                      type="text" name="name"
                      placeholder="Enter client name"
                      value={formData.name} onChange={handleChange}
                      className={errors.name ? "is-invalid" : ""}
                    />
                    {errors.name && <p className="error-message">{errors.name}</p>}
                  </div>

                  <div className="cf-field">
                    <label className="required">Company Name</label>
                    <input
                      type="text" name="company_name"
                      placeholder="Enter company name"
                      value={formData.company_name} onChange={handleChange}
                      className={errors.company_name ? "is-invalid" : ""}
                    />
                    {errors.company_name && <p className="error-message">{errors.company_name}</p>}
                  </div>
                </div>

                {/* Row 2: Contact & Email */}
                <div className="cf-row">
                  <div className="cf-field">
                    <label className="required">Contact</label>
                    <input
                      type="text" name="contact"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.contact} onChange={handleChange}
                      className={errors.contact ? "is-invalid" : ""}
                    />
                    {errors.contact && <p className="error-message">{errors.contact}</p>}
                  </div>

                  <div className="cf-field">
                    <label className="required">Email</label>
                    <input
                      type="email" name="email"
                      placeholder="example@company.com"
                      value={formData.email} onChange={handleChange}
                      disabled={isEditMode}
                      className={errors.email ? "is-invalid" : ""}
                    />
                    {errors.email && <p className="error-message">{errors.email}</p>}
                  </div>
                </div>

                {/* Row 3: Address full-width */}
                <div className="cf-field cf-field-full">
                  <label className="required">Address</label>
                  <textarea
                    name="address"
                    placeholder="Enter full client address"
                    value={formData.address} onChange={handleChange} rows={3}
                    className={errors.address ? "is-invalid" : ""}
                  />
                  {errors.address && <p className="error-message">{errors.address}</p>}
                </div>

                {/* Actions */}
                <div className="cf-actions">
                  <button type="submit" className="btn btn-secondary">
                    <FaSave /> {isEditMode ? "Update Client" : "Save Client"}
                  </button>
                  {!isEditMode && (
                    <button type="button" className="btn btn-back" onClick={handleReset}>
                      <FaRedo /> Reset
                    </button>
                  )}
                </div>

              </form>
            </section>
          </div>
        </div>
      </main>

      <style>{`
        /*
          No overflow-x anywhere — the whole page fits the viewport.
          Inputs use width:100% inside the grid so they stretch
          naturally without pushing past the card edge.
        */

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

        /* Header */
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

        /* Two-column grid row */
        .cf-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        /* Field */
        .cf-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0; /* prevents grid blowout */
        }
        .cf-field-full {
          margin-bottom: 20px;
        }

        /* Inputs fill their column, never overflow */
        .cf-field input,
        .cf-field textarea,
        .cf-field select {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .cf-field textarea {
          height: auto;
          min-height: 90px;
          resize: vertical;
        }

        /* Actions */
        .cf-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid var(--neutral-100, #f1f5f9);
        }

        /* Tablet */
        @media (max-width: 1023px) {
          .cf-card { padding: 24px; }
        }

        /* Mobile ≤ 767px — single column */
        @media (max-width: 767px) {
          .cf-page-wrapper { padding: 6px 10px 32px; }
          .cf-card { padding: 18px; border-radius: 12px; }
          .cf-row { grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; }
          .cf-form-header { margin-bottom: 20px; }
          .cf-field-full { margin-bottom: 16px; }
        }

        /* Small phones ≤ 479px */
        @media (max-width: 479px) {
          .cf-page-wrapper { padding: 4px 8px 24px; }
          .cf-card { padding: 14px; border-radius: 10px; }
          .cf-form-title { font-size: 15px; }
          .cf-actions { flex-direction: column; }
          .cf-actions .btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <Popup
        show={popup.show} type={popup.type} title={popup.title} message={popup.message}
        onClose={closePopup} onConfirm={handleConfirm}
        confirmText={popup.type === "delete" ? "Delete" : "OK"}
        cancelText="Cancel" showCancel={popup.type === "delete"}
      />
    </>
  );
};

export default ClientForm;