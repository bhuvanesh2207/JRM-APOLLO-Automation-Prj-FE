import React, { useState, useRef, useEffect } from "react";
import {
  FaPlusCircle, FaSave, FaRedo, FaArrowRight, FaArrowLeft,
} from "react-icons/fa";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

const DomainForm = () => {
  const formRef = useRef(null);
  const navigate = useNavigate();

  const today = new Date();
  const minPurchaseDate = "2000-01-01";
  const maxPurchaseDate = today.toISOString().split("T")[0];

  const [currentStep, setCurrentStep] = useState(1);
  const [clients, setClients] = useState([]);

  const [popupConfig, setPopupConfig] = useState({
    show: false, type: "info", title: "", message: "",
    confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null,
  });
  const openPopup = (config) =>
    setPopupConfig({ show: true, type: "info", title: "", message: "",
      confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null, ...config });
  const closePopup = () => setPopupConfig((p) => ({ ...p, show: false }));

  const [formData, setFormData] = useState({
    client_name: "", domain_name: "", registrar: "",
    purchase_date: "", expiry_date: "", active_status: true,
    ssh_name: "", ssh_purchase_date: "", ssh_expiry_date: "",
    hosting_name: "", hosting_purchase_date: "", hosting_expiry_date: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get("/api/client/names/");
        setClients(res.data.clients || []);
      } catch {
        openPopup({ type: "error", title: "Failed to Load Clients",
          message: "Could not fetch client list. You can still continue." });
      }
    };
    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleReset = () => {
    openPopup({
      type: "warning", title: "Reset Form",
      message: "Are you sure you want to clear all fields and start over?",
      showCancel: true, confirmText: "Yes, Reset",
      onConfirm: () => {
        setFormData({
          client_name: "", domain_name: "", registrar: "",
          purchase_date: "", expiry_date: "", active_status: true,
          ssh_name: "", ssh_purchase_date: "", ssh_expiry_date: "",
          hosting_name: "", hosting_purchase_date: "", hosting_expiry_date: "",
        });
        setErrors({});
        setCurrentStep(1);
        closePopup();
      },
    });
  };

  const validateStep = (step) => {
    const e = {};
    const domainRegex =
      /^(?!https?:\/\/)(?!www\.)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

    if (step === 1) {
      if (!formData.client_name) e.client_name = "Client is required.";
      if (!formData.domain_name.trim()) e.domain_name = "Domain name is required.";
      else if (!domainRegex.test(formData.domain_name.trim()))
        e.domain_name = "Enter a valid domain (e.g. example.com)";
      if (!formData.registrar.trim()) e.registrar = "Registrar is required.";
      if (!formData.purchase_date) e.purchase_date = "Purchase date is required.";
      if (!formData.expiry_date) e.expiry_date = "Expiry date is required.";
      if (formData.purchase_date && formData.expiry_date &&
        new Date(formData.expiry_date) <= new Date(formData.purchase_date))
        e.expiry_date = "Expiry date must be after purchase date.";
    }

    if (step === 2 && formData.ssh_name.trim()) {
      if (!formData.ssh_purchase_date) e.ssh_purchase_date = "SSH purchase date is required.";
      if (!formData.ssh_expiry_date) e.ssh_expiry_date = "SSH expiry date is required.";
      if (formData.ssh_purchase_date && formData.ssh_expiry_date &&
        new Date(formData.ssh_expiry_date) <= new Date(formData.ssh_purchase_date))
        e.ssh_expiry_date = "SSH expiry must be after purchase date.";
    }

    if (step === 3 && formData.hosting_name.trim()) {
      if (!formData.hosting_purchase_date) e.hosting_purchase_date = "Hosting purchase date is required.";
      if (!formData.hosting_expiry_date) e.hosting_expiry_date = "Hosting expiry date is required.";
      if (formData.hosting_purchase_date && formData.hosting_expiry_date &&
        new Date(formData.hosting_expiry_date) <= new Date(formData.hosting_purchase_date))
        e.hosting_expiry_date = "Hosting expiry must be after purchase date.";
    }

    return e;
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      const first = Object.keys(stepErrors)[0];
      formRef.current?.querySelector(`[name="${first}"]`)?.focus();
    } else {
      setErrors({});
      setCurrentStep((p) => p + 1);
    }
  };

  const handlePrev = () => { setErrors({}); setCurrentStep((p) => p - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalErrors = validateStep(3);
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      openPopup({ type: "error", title: "Validation Failed",
        message: "Please fix the errors before submitting." });
      return;
    }
    const payload = {
      client_name:          formData.client_name || null,
      domain_name:          formData.domain_name.trim(),
      registrar:            formData.registrar.trim() || null,
      purchase_date:        formData.purchase_date || null,
      expiry_date:          formData.expiry_date || null,
      active_status:        formData.active_status,
      ssh_name:             formData.ssh_name.trim() || null,
      ssh_purchase_date:    formData.ssh_purchase_date || null,
      ssh_expiry_date:      formData.ssh_expiry_date || null,
      hosting_name:         formData.hosting_name.trim() || null,
      hosting_purchase_date:formData.hosting_purchase_date || null,
      hosting_expiry_date:  formData.hosting_expiry_date || null,
    };
    try {
      await api.post("/api/domain/add/", payload);
      openPopup({
        type: "success", title: "Domain Added Successfully!",
        message: "Your domain has been saved.",
        confirmText: "Go to List", showCancel: true, cancelText: "Add Another",
        onConfirm: () => navigate("/domain/all"),
      });
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : err.response?.data?.error || "Failed to add domain.";
      openPopup({ type: "error", title: "Failed to Save", message: msg });
    }
  };

  const steps = ["Domain", "SSH", "Hosting"];

  return (
    <>
      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AutoBreadcrumb />

          <div className="bg-white rounded-lg shadow-lg p-6">
            <section className="df-section" ref={formRef}>

              {/* ── Step Header ── */}
              <h2 className="df-heading">
                <FaPlusCircle className="domain-icon" />
                {currentStep === 1 && "Domain Details"}
                {currentStep === 2 && "SSH Details"}
                {currentStep === 3 && "Hosting Details"}
                <span className="step-indicator">(Step {currentStep}/3)</span>
              </h2>

              {/* ── Progress Stepper ── */}
              <div className="df-stepper">
                {steps.map((label, i) => {
                  const num = i + 1;
                  const active = num === currentStep;
                  const done = num < currentStep;
                  return (
                    <React.Fragment key={label}>
                      <div className={`df-step${active ? " df-step--active" : ""}${done ? " df-step--done" : ""}`}>
                        <div className="df-step-circle">{done ? "✓" : num}</div>
                        <span className="df-step-label">{label}</span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`df-step-line${done ? " df-step-line--done" : ""}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <form onSubmit={(e) => e.preventDefault()} noValidate>

                {/* ══════════════════════════════════════
                    STEP 1 — DOMAIN
                ══════════════════════════════════════ */}
                {currentStep === 1 && (
                  <>
                    {/* Row 1: Client + Domain Name */}
                    <div className="df-row">
                      <div className="df-field">
                        <label className="required">Client</label>
                        <select name="client_name" value={formData.client_name} onChange={handleChange}>
                          <option value="">-- Select Client --</option>
                          {clients.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        {errors.client_name && <p className="error-message">{errors.client_name}</p>}
                      </div>

                      <div className="df-field">
                        <label className="required">Domain Name</label>
                        <input type="text" name="domain_name" placeholder="example.com"
                          value={formData.domain_name} onChange={handleChange} />
                        {errors.domain_name && <p className="error-message">{errors.domain_name}</p>}
                      </div>
                    </div>

                    {/* Row 2: Registrar + Status */}
                    <div className="df-row">
                      <div className="df-field">
                        <label className="required">Registrar</label>
                        <input type="text" name="registrar" placeholder="e.g. GoDaddy, Namecheap"
                          value={formData.registrar} onChange={handleChange} />
                        {errors.registrar && <p className="error-message">{errors.registrar}</p>}
                      </div>

                      <div className="df-field">
                        <label className="required">Status</label>
                        <div className="radio-group">
                          <label>
                            <input type="radio" name="active_status"
                              checked={formData.active_status === true}
                              onChange={() => setFormData({ ...formData, active_status: true })} />
                            Active
                          </label>
                          <label>
                            <input type="radio" name="active_status"
                              checked={formData.active_status === false}
                              onChange={() => setFormData({ ...formData, active_status: false })} />
                            Inactive
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Purchase Date + Expiry Date */}
                    <div className="df-row">
                      <div className="df-field">
                        <label className="required">Purchase Date</label>
                        <input type="date" name="purchase_date"
                          min={minPurchaseDate} max={maxPurchaseDate}
                          value={formData.purchase_date} onChange={handleChange} />
                        {errors.purchase_date && <p className="error-message">{errors.purchase_date}</p>}
                      </div>
                      <div className="df-field">
                        <label className="required">Expiry Date</label>
                        <input type="date" name="expiry_date"
                          min={formData.purchase_date || minPurchaseDate}
                          value={formData.expiry_date} onChange={handleChange} />
                        {errors.expiry_date && <p className="error-message">{errors.expiry_date}</p>}
                      </div>
                    </div>
                  </>
                )}

                {/* ══════════════════════════════════════
                    STEP 2 — SSH
                ══════════════════════════════════════ */}
                {currentStep === 2 && (
                  <>
                    <h3 className="section-title">
                      SSH Configuration <span className="df-optional">(Optional)</span>
                    </h3>

                    <div className="df-field df-field-full">
                      <label>SSH Name</label>
                      <input type="text" name="ssh_name" placeholder="e.g. DigitalOcean Droplet"
                        value={formData.ssh_name} onChange={handleChange} />
                    </div>

                    <div className="df-row">
                      <div className="df-field">
                        <label>SSH Purchase Date</label>
                        <input type="date" name="ssh_purchase_date"
                          min={minPurchaseDate} max={maxPurchaseDate}
                          value={formData.ssh_purchase_date} onChange={handleChange}
                          disabled={!formData.ssh_name.trim()} />
                        {errors.ssh_purchase_date && <p className="error-message">{errors.ssh_purchase_date}</p>}
                      </div>
                      <div className="df-field">
                        <label>SSH Expiry Date</label>
                        <input type="date" name="ssh_expiry_date"
                          min={formData.ssh_purchase_date || minPurchaseDate}
                          value={formData.ssh_expiry_date} onChange={handleChange}
                          disabled={!formData.ssh_name.trim()} />
                        {errors.ssh_expiry_date && <p className="error-message">{errors.ssh_expiry_date}</p>}
                      </div>
                    </div>
                  </>
                )}

                {/* ══════════════════════════════════════
                    STEP 3 — HOSTING
                ══════════════════════════════════════ */}
                {currentStep === 3 && (
                  <>
                    <h3 className="section-title">
                      Hosting Configuration <span className="df-optional">(Optional)</span>
                    </h3>

                    <div className="df-field df-field-full">
                      <label>Hosting Name</label>
                      <input type="text" name="hosting_name" placeholder="e.g. Hostinger, AWS, Vercel"
                        value={formData.hosting_name} onChange={handleChange} />
                    </div>

                    <div className="df-row">
                      <div className="df-field">
                        <label>Hosting Purchase Date</label>
                        <input type="date" name="hosting_purchase_date"
                          min={minPurchaseDate} max={maxPurchaseDate}
                          value={formData.hosting_purchase_date} onChange={handleChange}
                          disabled={!formData.hosting_name.trim()} />
                        {errors.hosting_purchase_date && <p className="error-message">{errors.hosting_purchase_date}</p>}
                      </div>
                      <div className="df-field">
                        <label>Hosting Expiry Date</label>
                        <input type="date" name="hosting_expiry_date"
                          min={formData.hosting_purchase_date || minPurchaseDate}
                          value={formData.hosting_expiry_date} onChange={handleChange}
                          disabled={!formData.hosting_name.trim()} />
                        {errors.hosting_expiry_date && <p className="error-message">{errors.hosting_expiry_date}</p>}
                      </div>
                    </div>
                  </>
                )}

                {/* ── Navigation Buttons ── */}
                <div className="df-form-actions">
                  {currentStep > 1 ? (
                    <button type="button" className="btn btn-secondary" onClick={handlePrev}>
                      <FaArrowLeft /> Previous
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="df-actions-right">
                    {currentStep < 3 ? (
                      <button type="button" className="btn btn-secondary" onClick={handleNext}>
                        Next <FaArrowRight />
                      </button>
                    ) : (
                      <>
                        <button type="button" className="btn btn-back" onClick={handleReset}>
                          <FaRedo /> Reset
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={handleSubmit}>
                          <FaSave /> Save Domain
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </form>
            </section>
          </div>
        </div>
      </main>

      {/* ── Scoped styles — no horizontal overflow anywhere ── */}
      <style>{`
        /*
          df-section: the form container inside the white card.
          All inputs use width:100% + box-sizing:border-box so they
          never push past their column.
        */
        .df-section {
          width: 100%;
        }

        /* Header */
        .df-heading {
          font-size: clamp(16px, 3vw, 20px);
          font-weight: 700;
          color: var(--primary, #0b91ac);
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--accent, #ff9800);
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        /* ── Two-column grid row ── */
        .df-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        /* ── Individual field ── */
        .df-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;           /* stops grid blowout */
        }
        .df-field-full {
          margin-bottom: 20px;
        }

        /*
          Override the global rule that sets max-width on inputs.
          Inside df-section every input must fill its column.
        */
        .df-section input,
        .df-section select,
        .df-section textarea {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        /* Radio group sits inside a field — keep it inline */
        .df-section .radio-group {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          align-items: center;
          padding-top: 10px;    /* align with sibling input vertically */
          min-height: 42px;     /* matches --input-height */
        }

        /* ── Mobile ≤ 767px — collapse to single column ── */
        @media (max-width: 767px) {
          .df-row {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }
          .df-field-full { margin-bottom: 16px; }
        }

        /* ── Small phones ≤ 479px ── */
        @media (max-width: 479px) {
          .df-heading { font-size: 15px; }
          .df-form-actions { flex-direction: column; align-items: stretch; }
          .df-form-actions > div,
          .df-actions-right { width: 100%; }
          .df-actions-right { flex-direction: column; }
          .df-actions-right .btn,
          .df-form-actions > .btn { width: 100%; justify-content: center; }
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

export default DomainForm;