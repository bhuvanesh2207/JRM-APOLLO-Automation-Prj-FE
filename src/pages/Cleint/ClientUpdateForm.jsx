import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaEdit, FaRedo } from "react-icons/fa";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const ClientUpdateForm = () => {
  const formRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: "", contact: "", email: "", companyName: "", address: "",
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const [popupConfig, setPopupConfig] = useState({
    show: false, type: "info", title: "", message: "",
    confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null,
  });
  const openPopup = (config) =>
    setPopupConfig({
      show: true, type: "info", title: "", message: "",
      confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null,
      ...config,
    });
  const closePopup = () => setPopupConfig((prev) => ({ ...prev, show: false }));

  /* ── Fetch client ── */
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api.get(`/api/client/get/${id}/`);
        setFormData({
          name:        res.data.name        || "",
          contact:     res.data.contact     || "",
          email:       res.data.email       || "",
          companyName: res.data.companyName || "",
          address:     res.data.address     || "",
        });
      } catch (err) {
        openPopup({
          type: "error", title: "Error",
          message: err.response?.data?.error || "Failed to fetch client details.",
          onConfirm: () => navigate("/client/all"),
        });
      } finally { setLoading(false); }
    })();
  }, [id, navigate]);

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!formData.name.trim())                                    e.name        = "Name is required";
    else if (formData.name.trim().length < 2)                     e.name        = "Name must be at least 2 characters";
    if (!formData.companyName.trim())                             e.companyName = "Company name is required";
    if (!formData.contact.trim())                                 e.contact     = "Contact number is required";
    else if (!/^[0-9+\-\s()]{7,20}$/.test(formData.contact))     e.contact     = "Enter a valid contact number";
    if (!formData.email.trim())                                   e.email       = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email       = "Enter a valid email address";
    if (!formData.address.trim())                                 e.address     = "Address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleReset = () => {
    openPopup({
      type: "warning", title: "Reset Form",
      message: "Are you sure you want to reset all fields?",
      showCancel: true, confirmText: "Reset", cancelText: "Cancel",
      onConfirm: () => {
        setFormData({ name: "", contact: "", email: "", companyName: "", address: "" });
        setErrors({});
        closePopup();
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      openPopup({ type: "error", title: "Validation Error",
        message: "Please fix the errors in the form before submitting." });
      formRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    try {
      await api.put(`/api/client/update/${id}/`, {
        name:         formData.name.trim(),
        contact:      formData.contact.trim(),
        email:        formData.email.trim(),
        company_name: formData.companyName.trim(),
        address:      formData.address.trim(),
      });
      openPopup({
        type: "success", title: "Success!", message: "Client updated successfully.",
        onConfirm: () => { closePopup(); navigate("/client/all"); },
      });
    } catch (err) {
      openPopup({ type: "error", title: "Update Failed",
        message: err.response?.data?.error || "Failed to update client." });
    }
  };

  return (
    <>
      <main className="app-main">
        <div className="cuf-page-wrapper">
          <AutoBreadcrumb />

          <div className="cuf-card">
            <section ref={formRef}>

              {/* Header */}
              <div className="cuf-form-header">
                <h2 className="cuf-form-title">
                  <FaEdit className="domain-icon" /> Update Client
                </h2>
              </div>

              {loading ? (
                <div className="cuf-loading">
                  <span className="cuf-spinner" /> Loading client details…
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>

                  {/* Row 1: Name & Company */}
                  <div className="cuf-row">
                    <div className="cuf-field">
                      <label htmlFor="name" className="required">Name</label>
                      <input
                        type="text" id="name" name="name"
                        placeholder="Client name"
                        value={formData.name} onChange={handleChange}
                        className={errors.name ? "is-invalid" : ""}
                      />
                      {errors.name && <p className="error-message">{errors.name}</p>}
                    </div>

                    <div className="cuf-field">
                      <label htmlFor="companyName" className="required">Company Name</label>
                      <input
                        type="text" id="companyName" name="companyName"
                        placeholder="Company name"
                        value={formData.companyName} onChange={handleChange}
                        className={errors.companyName ? "is-invalid" : ""}
                      />
                      {errors.companyName && <p className="error-message">{errors.companyName}</p>}
                    </div>
                  </div>

                  {/* Row 2: Contact & Email */}
                  <div className="cuf-row">
                    <div className="cuf-field">
                      <label htmlFor="contact" className="required">Contact</label>
                      <input
                        type="text" id="contact" name="contact"
                        placeholder="Phone number"
                        value={formData.contact} onChange={handleChange}
                        className={errors.contact ? "is-invalid" : ""}
                      />
                      {errors.contact && <p className="error-message">{errors.contact}</p>}
                    </div>

                    <div className="cuf-field">
                      <label htmlFor="email" className="required">Email</label>
                      <input
                        type="email" id="email" name="email"
                        placeholder="client@example.com"
                        value={formData.email} onChange={handleChange}
                        className={errors.email ? "is-invalid" : ""}
                      />
                      {errors.email && <p className="error-message">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Row 3: Address full-width */}
                  <div className="cuf-field cuf-field-full">
                    <label htmlFor="address" className="required">Address</label>
                    <textarea
                      id="address" name="address"
                      placeholder="Full address"
                      value={formData.address} onChange={handleChange} rows={3}
                      className={errors.address ? "is-invalid" : ""}
                    />
                    {errors.address && <p className="error-message">{errors.address}</p>}
                  </div>

                  {/* Actions */}
                  <div className="cuf-actions">
                    <button type="submit" className="btn btn-secondary">
                      <FaEdit /> Update Client
                    </button>
                    <button type="button" className="btn btn-back" onClick={handleReset}>
                      <FaRedo /> Reset
                    </button>
                  </div>

                </form>
              )}
            </section>
          </div>
        </div>
      </main>

      <style>{`
        /*
          No overflow-x anywhere — page always fits the viewport.
        */

        .cuf-page-wrapper {
          width: 100%;
          max-width: 900px;
          margin-inline: auto;
          padding: 8px 16px 40px;
          box-sizing: border-box;
        }

        .cuf-card {
          width: 100%;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.05);
          padding: 32px;
          box-sizing: border-box;
        }

        /* Header */
        .cuf-form-header {
          padding-bottom: 14px;
          border-bottom: 2px solid var(--accent, #ff9800);
          margin-bottom: 28px;
        }
        .cuf-form-title {
          font-size: clamp(16px, 3vw, 22px);
          font-weight: 700;
          color: var(--primary, #0b91ac);
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }

        /* Two-column grid */
        .cuf-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        /* Field */
        .cuf-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0; /* prevent grid cell blowout */
        }
        .cuf-field-full {
          margin-bottom: 20px;
        }

        /* Inputs fill their column */
        .cuf-field input,
        .cuf-field textarea,
        .cuf-field select {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .cuf-field textarea {
          height: auto;
          min-height: 90px;
          resize: vertical;
        }

        /* Actions */
        .cuf-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid var(--neutral-100, #f1f5f9);
        }

        /* Loading */
        .cuf-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 48px 16px;
          color: var(--neutral-500, #64748b);
          font-size: 15px;
        }
        .cuf-spinner {
          display: inline-block;
          width: 20px; height: 20px;
          border: 2px solid var(--neutral-200, #e2e8f0);
          border-top-color: var(--primary, #0b91ac);
          border-radius: 50%;
          animation: cuf-spin .7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes cuf-spin { to { transform: rotate(360deg); } }

        /* Tablet */
        @media (max-width: 1023px) {
          .cuf-card { padding: 24px; }
        }

        /* Mobile ≤ 767px — single column */
        @media (max-width: 767px) {
          .cuf-page-wrapper { padding: 6px 10px 32px; }
          .cuf-card { padding: 18px; border-radius: 12px; }
          .cuf-row { grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; }
          .cuf-form-header { margin-bottom: 20px; }
          .cuf-field-full { margin-bottom: 16px; }
        }

        /* Small phones ≤ 479px */
        @media (max-width: 479px) {
          .cuf-page-wrapper { padding: 4px 8px 24px; }
          .cuf-card { padding: 14px; border-radius: 10px; }
          .cuf-form-title { font-size: 15px; }
          .cuf-actions { flex-direction: column; }
          .cuf-actions .btn { width: 100%; justify-content: center; }
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

export default ClientUpdateForm;