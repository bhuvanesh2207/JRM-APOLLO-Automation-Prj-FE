import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaEdit, FaArrowLeft } from "react-icons/fa";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const EditDomainPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const today = new Date();
  const minDate = "2000-01-01";
  const maxDateToday = today.toISOString().split("T")[0];

  const [selectedOption, setSelectedOption] = useState("update-info");

  const [formData, setFormData] = useState({
    domainName: "",
    registrar: "",
    clientName: "",
    activeStatus: true,
    purchaseDate: "",
    expiryDate: "",
    sshName: "",
    sshPurchaseDate: "",
    sshExpiryDate: "",
    hostingName: "",
    hostingPurchaseDate: "",
    hostingExpiryDate: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const [popup, setPopup] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });
  const showPopup = (type, title, message, onConfirm = null) =>
    setPopup({ show: true, type, title, message, onConfirm });
  const closePopup = () =>
    setPopup({
      show: false,
      type: "info",
      title: "",
      message: "",
      onConfirm: null,
    });
  const handleConfirm = () => {
    popup.onConfirm?.();
    closePopup();
  };

  /* ── Fetch ── */
  const fetchDomainDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/domain/get/${id}/`);
      const data = res.data;
      let activeStatusValue = true;
      if (typeof data.active_status === "boolean") {
        activeStatusValue = data.active_status;
      } else if (typeof data.active_status === "string") {
        const s = data.active_status.toLowerCase();
        activeStatusValue = !(s === "inactive" || s === "false" || s === "0");
      }
      setFormData({
        domainName: data.domain_name || "",
        registrar: data.registrar || "",
        clientName: data.client_name || "",
        activeStatus: activeStatusValue,
        purchaseDate: data.purchase_date || "",
        expiryDate: data.expiry_date || "",
        sshName: data.ssh_name || "",
        sshPurchaseDate: data.ssh_purchase_date || "",
        sshExpiryDate: data.ssh_expiry_date || "",
        hostingName: data.hosting_name || "",
        hostingPurchaseDate: data.hosting_purchase_date || "",
        hostingExpiryDate: data.hosting_expiry_date || "",
      });
    } catch (err) {
      setError("Failed to fetch domain details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomainDetails();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const newValue =
      name === "activeStatus" && type === "radio" ? value === "true" : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /* ── Validation ── */
  const validateDomainInfo = () => {
    const e = {};
    const domainRegex =
      /^(?!https?:\/\/)(?!www\.)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    if (!formData.domainName.trim()) e.domainName = "Domain name is required.";
    else if (!domainRegex.test(formData.domainName.trim()))
      e.domainName = "Enter a valid domain (e.g. example.com).";
    if (!formData.clientName.trim()) e.clientName = "Client name is required.";
    if (!formData.purchaseDate) e.purchaseDate = "Purchase date is required.";
    if (!formData.expiryDate) e.expiryDate = "Expiry date is required.";
    if (
      formData.purchaseDate &&
      formData.expiryDate &&
      new Date(formData.expiryDate) <= new Date(formData.purchaseDate)
    )
      e.expiryDate = "Expiry date must be after purchase date.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateSSH = () => {
    const e = {};
    if (!formData.sshName.trim()) e.sshName = "SSH name is required.";
    if (!formData.sshPurchaseDate)
      e.sshPurchaseDate = "SSH purchase date is required.";
    if (!formData.sshExpiryDate)
      e.sshExpiryDate = "SSH expiry date is required.";
    if (
      formData.sshPurchaseDate &&
      formData.sshExpiryDate &&
      new Date(formData.sshExpiryDate) <= new Date(formData.sshPurchaseDate)
    )
      e.sshExpiryDate = "SSH expiry must be after purchase date.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateHosting = () => {
    const e = {};
    if (!formData.hostingName.trim())
      e.hostingName = "Hosting name is required.";
    if (!formData.hostingPurchaseDate)
      e.hostingPurchaseDate = "Hosting purchase date is required.";
    if (!formData.hostingExpiryDate)
      e.hostingExpiryDate = "Hosting expiry date is required.";
    if (
      formData.hostingPurchaseDate &&
      formData.hostingExpiryDate &&
      new Date(formData.hostingExpiryDate) <=
        new Date(formData.hostingPurchaseDate)
    )
      e.hostingExpiryDate = "Hosting expiry must be after purchase date.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit handlers ── */
  const handleSubmitDomainInfo = async (e) => {
    e.preventDefault();
    if (!validateDomainInfo()) return;
    try {
      const res = await api.patch(`/api/domain/update/${id}/`, {
        domain_name: formData.domainName,
        registrar: formData.registrar,
        client_name: formData.clientName,
        active_status: formData.activeStatus,
        purchase_date: formData.purchaseDate,
        expiry_date: formData.expiryDate,
        changes_message: "Updated domain info",
      });
      showPopup(
        "success",
        "Success",
        res.data.message || "Domain info updated!",
      );
    } catch (err) {
      showPopup(
        "error",
        "Error",
        err.response?.data?.errors
          ? JSON.stringify(err.response.data.errors)
          : "Server error",
      );
    }
  };

  const handleSubmitSSH = async (e) => {
    e.preventDefault();
    if (!validateSSH()) return;
    try {
      const res = await api.patch(`/api/domain/update/${id}/`, {
        ssh_name: formData.sshName,
        ssh_purchase_date: formData.sshPurchaseDate,
        ssh_expiry_date: formData.sshExpiryDate,
        changes_message: "Updated SSH details",
      });
      showPopup(
        "success",
        "Success",
        res.data.message || "SSH details updated!",
      );
    } catch {
      showPopup(
        "error",
        "Error",
        "Server error. Could not update SSH details.",
      );
    }
  };

  const handleSubmitHosting = async (e) => {
    e.preventDefault();
    if (!validateHosting()) return;
    try {
      const res = await api.patch(`/api/domain/update/${id}/`, {
        hosting_name: formData.hostingName,
        hosting_purchase_date: formData.hostingPurchaseDate,
        hosting_expiry_date: formData.hostingExpiryDate,
        changes_message: "Updated Hosting details",
      });
      showPopup(
        "success",
        "Success!",
        res.data.message || "Hosting details updated!",
      );
    } catch {
      showPopup(
        "error",
        "Error",
        "Server error. Could not update Hosting details.",
      );
    }
  };

  if (loading) return <div className="p-5">Loading domain details...</div>;
  if (error)
    return (
      <div className="p-5" style={{ color: "var(--error)" }}>
        {error}
      </div>
    );

  /* ─────────────────────────────────────────────────────────
     Layout.jsx provides app-shell → Sidebar, Navbar, Footer.
     This component renders only what goes inside <Outlet />.
  ───────────────────────────────────────────────────────── */
  return (
    <>
      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AutoBreadcrumb />

          <div className="bg-white rounded-lg shadow-lg p-6">
            <section className="ed-section">
              {/* ── Page heading ── */}
              <div className="ed-heading-row">
                <h2 className="ed-heading">
                  <FaEdit className="domain-icon" /> Edit Domain
                </h2>
              </div>

              {/* ── Tab buttons ── */}
              <div className="tab-buttons">
                {[
                  { key: "update-info", label: "Domain Info" },
                  { key: "ssh", label: "SSH Details" },
                  { key: "hosting", label: "Hosting Details" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`btn btn-outline${selectedOption === key ? " btn-active" : ""}`}
                    onClick={() => {
                      setSelectedOption(key);
                      setErrors({});
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ══════════════════════════════════════
                  TAB 1 — DOMAIN INFO
              ══════════════════════════════════════ */}
              {selectedOption === "update-info" && (
                <form onSubmit={handleSubmitDomainInfo} noValidate>
                  {/* Row 1: Client Name + Domain Name */}
                  <div className="ed-row">
                    <div className="ed-field">
                      <label className="required">Client Name</label>
                      <input
                        type="text"
                        name="clientName"
                        placeholder="Enter client name"
                        value={formData.clientName}
                        onChange={handleChange}
                      />
                      {errors.clientName && (
                        <p className="error-message">{errors.clientName}</p>
                      )}
                    </div>
                    <div className="ed-field">
                      <label className="required">Domain Name</label>
                      <input
                        type="text"
                        name="domainName"
                        placeholder="example.com"
                        value={formData.domainName}
                        onChange={handleChange}
                      />
                      {errors.domainName && (
                        <p className="error-message">{errors.domainName}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Registrar + Status */}
                  <div className="ed-row">
                    <div className="ed-field">
                      <label>Registrar</label>
                      <input
                        type="text"
                        name="registrar"
                        placeholder="e.g. GoDaddy, Namecheap"
                        value={formData.registrar}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="ed-field">
                      <label className="required">Status</label>
                      <div className="radio-group ed-radio">
                        <label>
                          <input
                            type="radio"
                            name="activeStatus"
                            value="true"
                            checked={formData.activeStatus === true}
                            onChange={handleChange}
                          />
                          Active
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="activeStatus"
                            value="false"
                            checked={formData.activeStatus === false}
                            onChange={handleChange}
                          />
                          Inactive
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Purchase Date + Expiry Date */}
                  <div className="ed-row">
                    <div className="ed-field">
                      <label className="required">Purchase Date</label>
                      <input
                        type="date"
                        name="purchaseDate"
                        min={minDate}
                        max={maxDateToday}
                        value={formData.purchaseDate}
                        onChange={handleChange}
                      />
                      {errors.purchaseDate && (
                        <p className="error-message">{errors.purchaseDate}</p>
                      )}
                    </div>
                    <div className="ed-field">
                      <label className="required">Expiry Date</label>
                      <input
                        type="date"
                        name="expiryDate"
                        min={formData.purchaseDate || minDate}
                        value={formData.expiryDate}
                        onChange={handleChange}
                      />
                      {errors.expiryDate && (
                        <p className="error-message">{errors.expiryDate}</p>
                      )}
                    </div>
                  </div>

                  <div className="ed-actions">
                    <button type="submit" className="btn btn-secondary">
                      <FaEdit /> Update Domain Info
                    </button>
                  </div>
                </form>
              )}

              {/* ══════════════════════════════════════
                  TAB 2 — SSH DETAILS
              ══════════════════════════════════════ */}
              {selectedOption === "ssh" && (
                <form onSubmit={handleSubmitSSH} noValidate>
                  {/* SSH Name — full width */}
                  <div className="ed-field ed-field-full">
                    <label className="required">SSH Name</label>
                    <input
                      type="text"
                      name="sshName"
                      placeholder="e.g. DigitalOcean Droplet"
                      value={formData.sshName}
                      onChange={handleChange}
                    />
                    {errors.sshName && (
                      <p className="error-message">{errors.sshName}</p>
                    )}
                  </div>

                  {/* Row: SSH Purchase + Expiry */}
                  <div className="ed-row">
                    <div className="ed-field">
                      <label className="required">SSH Purchase Date</label>
                      <input
                        type="date"
                        name="sshPurchaseDate"
                        min={minDate}
                        max={maxDateToday}
                        value={formData.sshPurchaseDate}
                        onChange={handleChange}
                      />
                      {errors.sshPurchaseDate && (
                        <p className="error-message">
                          {errors.sshPurchaseDate}
                        </p>
                      )}
                    </div>
                    <div className="ed-field">
                      <label className="required">SSH Expiry Date</label>
                      <input
                        type="date"
                        name="sshExpiryDate"
                        min={formData.sshPurchaseDate || minDate}
                        value={formData.sshExpiryDate}
                        onChange={handleChange}
                      />
                      {errors.sshExpiryDate && (
                        <p className="error-message">{errors.sshExpiryDate}</p>
                      )}
                    </div>
                  </div>

                  <div className="ed-actions">
                    <button type="submit" className="btn btn-secondary">
                      <FaEdit /> Update SSH Details
                    </button>
                  </div>
                </form>
              )}

              {/* ══════════════════════════════════════
                  TAB 3 — HOSTING DETAILS
              ══════════════════════════════════════ */}
              {selectedOption === "hosting" && (
                <form onSubmit={handleSubmitHosting} noValidate>
                  {/* Hosting Name — full width */}
                  <div className="ed-field ed-field-full">
                    <label className="required">Hosting Name</label>
                    <input
                      type="text"
                      name="hostingName"
                      placeholder="e.g. Hostinger, AWS, Vercel"
                      value={formData.hostingName}
                      onChange={handleChange}
                    />
                    {errors.hostingName && (
                      <p className="error-message">{errors.hostingName}</p>
                    )}
                  </div>

                  {/* Row: Hosting Purchase + Expiry */}
                  <div className="ed-row">
                    <div className="ed-field">
                      <label className="required">Hosting Purchase Date</label>
                      <input
                        type="date"
                        name="hostingPurchaseDate"
                        min={minDate}
                        max={maxDateToday}
                        value={formData.hostingPurchaseDate}
                        onChange={handleChange}
                      />
                      {errors.hostingPurchaseDate && (
                        <p className="error-message">
                          {errors.hostingPurchaseDate}
                        </p>
                      )}
                    </div>
                    <div className="ed-field">
                      <label className="required">Hosting Expiry Date</label>
                      <input
                        type="date"
                        name="hostingExpiryDate"
                        min={formData.hostingPurchaseDate || minDate}
                        value={formData.hostingExpiryDate}
                        onChange={handleChange}
                      />
                      {errors.hostingExpiryDate && (
                        <p className="error-message">
                          {errors.hostingExpiryDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="ed-actions">
                    <button type="submit" className="btn btn-secondary">
                      <FaEdit /> Update Hosting Details
                    </button>
                  </div>
                </form>
              )}

              {/* ── Back button ── */}
              <button
                type="button"
                className="btn btn-back ed-back"
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft /> Back
              </button>
            </section>
          </div>
        </div>
      </main>

      {/* ── Scoped styles — no horizontal overflow anywhere ── */}
      <style>{` `}</style>

      <Popup
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default EditDomainPage;
