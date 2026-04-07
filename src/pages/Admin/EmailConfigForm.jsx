import React, { useState, useRef, useEffect } from "react";
import { FaPlusCircle, FaSave, FaRedo } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const EmailConfigForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    host: "smtp.gmail.com",
    port: "587",
    use_tls: true,
    host_user: "",
    host_password: "",
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

  useEffect(() => { if (isEditMode) fetchConfig(); }, [id]);

  const fetchConfig = async () => {
    try {
      const res = await api.get(`/api/email-config/${id}/`);
      const c = res.data.config;
      setFormData({
        name: c.name || "",
        host: c.host || "smtp.gmail.com",
        port: String(c.port || 587),
        use_tls: c.use_tls ?? true,
        host_user: c.host_user || "",
        host_password: "",        // never prefill password
      });
    } catch {
      showPopup("error", "Error", "Failed to load email config.");
    }
  };

  const validate = () => {
    const e = {};
    if (!formData.name.trim())          e.name          = "Config name is required";
    if (!formData.host.trim())          e.host          = "SMTP host is required";
    if (!formData.port)                 e.port          = "Port is required";
    if (!formData.host_user.trim())     e.host_user     = "Email is required";
    if (!isEditMode && !formData.host_password.trim())
                                        e.host_password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { formRef.current?.scrollIntoView({ behavior: "smooth" }); return; }

    const payload = { ...formData, port: Number(formData.port) };
    // In edit mode, skip password if left blank
    if (isEditMode && !payload.host_password) delete payload.host_password;

    try {
      if (isEditMode) {
        await api.patch(`/api/email-config/update/${id}/`, payload);
        showPopup("success", "Success", "Email config updated.", () => navigate("/email-config/all"));
      } else {
        await api.post("/api/email-config/add/", payload);
        showPopup("success", "Success", "Email config saved.", () => navigate("/email-config/all"));
      }
    } catch {
      showPopup("error", "Error", "Failed to save email config.");
    }
  };

  const handleReset = () => {
    setFormData({ name: "", host: "smtp.gmail.com", port: "587", use_tls: true, host_user: "", host_password: "" });
    setErrors({});
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
                  <FaPlusCircle className="domain-icon" />
                  {isEditMode ? "Edit Email Config" : "Add Email Config"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} noValidate>

                {/* Row 1: Config Name & SMTP Host */}
                <div className="cf-row">
                  <div className="cf-field">
                    <label className="required">Config Name</label>
                    <input
                      type="text" name="name"
                      placeholder='e.g. gmail-main'
                      value={formData.name} onChange={handleChange}
                      className={errors.name ? "is-invalid" : ""}
                    />
                    {errors.name && <p className="error-message">{errors.name}</p>}
                  </div>

                  <div className="cf-field">
                    <label className="required">SMTP Host</label>
                    <input
                      type="text" name="host"
                      placeholder="smtp.gmail.com"
                      value={formData.host} onChange={handleChange}
                      className={errors.host ? "is-invalid" : ""}
                    />
                    {errors.host && <p className="error-message">{errors.host}</p>}
                  </div>
                </div>

                {/* Row 2: Port & TLS */}
                <div className="cf-row">
                  <div className="cf-field">
                    <label className="required">Port</label>
                    <input
                      type="number" name="port"
                      placeholder="587"
                      value={formData.port} onChange={handleChange}
                      className={errors.port ? "is-invalid" : ""}
                    />
                    {errors.port && <p className="error-message">{errors.port}</p>}
                  </div>

                  <div className="cf-field" style={{ justifyContent: "center" }}>
                    <label>Use TLS</label>
                    <label className="ec-toggle">
                      <input
                        type="checkbox" name="use_tls"
                        checked={formData.use_tls} onChange={handleChange}
                      />
                      <span className="ec-slider" />
                      <span className="ec-toggle-label">
                        {formData.use_tls ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Row 3: Email & Password */}
                <div className="cf-row">
                  <div className="cf-field">
                    <label className="required">Email (host user)</label>
                    <input
                      type="email" name="host_user"
                      placeholder="you@gmail.com"
                      value={formData.host_user} onChange={handleChange}
                      className={errors.host_user ? "is-invalid" : ""}
                    />
                    {errors.host_user && <p className="error-message">{errors.host_user}</p>}
                  </div>

                  <div className="cf-field">
                    <label className={!isEditMode ? "required" : ""}>
                      App Password {isEditMode && <span style={{ fontWeight: 400, fontSize: 12, color: "#888" }}>(leave blank to keep current)</span>}
                    </label>
                    <input
                      type="password" name="host_password"
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={formData.host_password} onChange={handleChange}
                      className={errors.host_password ? "is-invalid" : ""}
                    />
                    {errors.host_password && <p className="error-message">{errors.host_password}</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="cf-actions">
                  <button type="submit" className="btn btn-secondary">
                    <FaSave /> {isEditMode ? "Update Config" : "Save Config"}
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
        .cf-page-wrapper {
          width: 100%; max-width: 900px;
          margin-inline: auto; padding: 8px 16px 40px; box-sizing: border-box;
        }
        .cf-card {
          width: 100%; background: #fff; border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.05);
          padding: 32px; box-sizing: border-box;
        }
        .cf-form-header {
          padding-bottom: 14px; border-bottom: 2px solid var(--accent, #ff9800); margin-bottom: 28px;
        }
        .cf-form-title {
          font-size: clamp(16px,3vw,22px); font-weight: 700;
          color: var(--primary, #0b91ac); display: flex; align-items: center; gap: 8px; margin: 0;
        }
        .cf-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;
        }
        .cf-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .cf-field input, .cf-field select {
          width: 100%; max-width: 100%; box-sizing: border-box;
        }
        .cf-actions {
          display: flex; flex-wrap: wrap; gap: 12px;
          margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9;
        }

        /* Toggle switch */
        .ec-toggle {
          display: flex; align-items: center; gap: 10px; cursor: pointer; margin-top: 4px;
        }
        .ec-toggle input { display: none; }
        .ec-slider {
          position: relative; width: 44px; height: 24px;
          background: #ccc; border-radius: 12px; transition: background .2s; flex-shrink: 0;
        }
        .ec-slider::after {
          content: ""; position: absolute; top: 3px; left: 3px;
          width: 18px; height: 18px; background: #fff;
          border-radius: 50%; transition: transform .2s;
        }
        .ec-toggle input:checked + .ec-slider { background: var(--primary, #0b91ac); }
        .ec-toggle input:checked + .ec-slider::after { transform: translateX(20px); }
        .ec-toggle-label { font-size: 14px; color: #555; }

        @media (max-width: 767px) {
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
        confirmText={popup.type === "delete" ? "Delete" : "OK"}
        cancelText="Cancel" showCancel={popup.type === "delete"}
      />
    </>
  );
};

export default EmailConfigForm;