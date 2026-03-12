import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaEdit, FaArrowLeft } from "react-icons/fa";
import Navbar from "../../compomnents/Navbar";
import Sidebar from "../../compomnents/Sidebar";
import Footer from "../../compomnents/Footer";

import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const EditDomainPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const today = new Date();
  const minDate = "2000-01-01";
  const maxDateToday = today.toISOString().split("T")[0]; // Only for Purchase dates

  const [selectedOption, setSelectedOption] = useState("update-info");

  // Initial State
  const [formData, setFormData] = useState({
    domainName: "",
    registrar: "",
    clientName: "",
    activeStatus: true, // boolean: true | false
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

  // Popup State
  const [popup, setPopup] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  // Show popup helper function
  const showPopup = (type, title, message, onConfirm = null) => {
    setPopup({
      show: true,
      type,
      title,
      message,
      onConfirm,
    });
  };

  // Close popup
  const closePopup = () => {
    setPopup({
      show: false,
      type: "info",
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  // Handle confirm action
  const handleConfirm = () => {
    if (popup.onConfirm) {
      popup.onConfirm();
    }
    closePopup();
  };

  // ---------------- FETCH ----------------
  const fetchDomainDetails = async () => {
    setLoading(true);
    try {
      // Matches BE: path('get/<int:domain_id>/', views.get_domain)
      const res = await api.get(`/api/domain/get/${id}/`);
      const data = res.data;

      // Normalize active_status coming from backend
      let activeStatusValue = true;
      if (typeof data.active_status === "boolean") {
        activeStatusValue = data.active_status;
      } else if (typeof data.active_status === "string") {
        const s = data.active_status.toLowerCase();
        if (s === "inactive" || s === "false" || s === "0") {
          activeStatusValue = false;
        } else {
          activeStatusValue = true;
        }
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
      console.error(err);
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

    let newValue = value;

    // Convert radio string value "true"/"false" to boolean
    if (name === "activeStatus" && type === "radio") {
      newValue = value === "true";
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ---------------- VALIDATION ----------------
  const validateDomainInfo = () => {
    const newErrors = {};

    const domainRegex =
      /^(?!https?:\/\/)(?!www\.)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

    if (!formData.domainName.trim()) {
      newErrors.domainName = "Domain name is required.";
    } else if (!domainRegex.test(formData.domainName.trim())) {
      newErrors.domainName = "Enter a valid domain (example: example.com).";
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = "Client name is required.";
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = "Purchase date is required.";
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = "Expiry date is required.";
    }

    if (formData.purchaseDate && formData.expiryDate) {
      if (new Date(formData.expiryDate) <= new Date(formData.purchaseDate)) {
        newErrors.expiryDate =
          "Domain expiry date must be after purchase date.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSSH = () => {
    const newErrors = {};

    if (!formData.sshName.trim()) {
      newErrors.sshName = "SSH name is required.";
    }

    if (!formData.sshPurchaseDate) {
      newErrors.sshPurchaseDate = "SSH purchase date is required.";
    }

    if (!formData.sshExpiryDate) {
      newErrors.sshExpiryDate = "SSH expiry date is required.";
    }

    if (formData.sshPurchaseDate && formData.sshExpiryDate) {
      if (
        new Date(formData.sshExpiryDate) <= new Date(formData.sshPurchaseDate)
      ) {
        newErrors.sshExpiryDate =
          "SSH expiry date must be after SSH purchase date.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateHosting = () => {
    const newErrors = {};

    if (!formData.hostingName.trim()) {
      newErrors.hostingName = "Hosting name is required.";
    }

    if (!formData.hostingPurchaseDate) {
      newErrors.hostingPurchaseDate = "Hosting purchase date is required.";
    }

    if (!formData.hostingExpiryDate) {
      newErrors.hostingExpiryDate = "Hosting expiry date is required.";
    }

    if (formData.hostingPurchaseDate && formData.hostingExpiryDate) {
      if (
        new Date(formData.hostingExpiryDate) <=
        new Date(formData.hostingPurchaseDate)
      ) {
        newErrors.hostingExpiryDate =
          "Hosting expiry date must be after Hosting purchase date.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------- SUBMIT HANDLERS ----------------
  const handleSubmitDomainInfo = async (e) => {
    e.preventDefault();

    if (!validateDomainInfo()) {
      return;
    }

    try {
      const payload = {
        domain_name: formData.domainName,
        registrar: formData.registrar,
        client_name: formData.clientName,
        active_status: formData.activeStatus, // boolean true/false
        purchase_date: formData.purchaseDate,
        expiry_date: formData.expiryDate,
        changes_message: "Updated domain info",
      };
      const res = await api.patch(`/api/domain/update/${id}/`, payload);

      showPopup(
        "success",
        "Success",
        res.data.message || "Domain info updated!",
      );
    } catch (err) {
      console.error(err.response?.data);
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

    if (!validateSSH()) {
      return;
    }

    try {
      const payload = {
        ssh_name: formData.sshName,
        ssh_purchase_date: formData.sshPurchaseDate,
        ssh_expiry_date: formData.sshExpiryDate,
        changes_message: "Updated SSH details",
      };
      const res = await api.patch(`/api/domain/update/${id}/`, payload);

      showPopup(
        "success",
        "Success",
        res.data.message || "SSH details updated!",
      );
    } catch (err) {
      console.error(err);
      showPopup(
        "error",
        "Error",
        "Server error. Could not update SSH details.",
      );
    }
  };

  const handleSubmitHosting = async (e) => {
    e.preventDefault();

    if (!validateHosting()) {
      return;
    }

    try {
      const payload = {
        hosting_name: formData.hostingName,
        hosting_purchase_date: formData.hostingPurchaseDate,
        hosting_expiry_date: formData.hostingExpiryDate,
        changes_message: "Updated Hosting details",
      };
      const res = await api.patch(`/api/domain/update/${id}/`, payload);
      showPopup(
        "success",
        "Success!",
        res.data.message || "Hosting details updated!",
      );
    } catch (err) {
      console.error(err);
      showPopup(
        "error",
        "Error",
        "Server error. Could not update Hosting details.",
      );
    }
  };

  if (loading) return <div className="p-5">Loading domain details...</div>;
  if (error) return <div className="p-5 text-red-600">{error}</div>;

  return (
    <div
      className="min-h-screen"
      style={{
        marginLeft: "var(--sidebar-current-width)",
        paddingTop: "var(--tw-topbar-height)",
      }}
    >
      <Sidebar />
      <Navbar />
      <main className="app-main">
        <div className="max-w-[1200px] mx-auto px-5 mt-6">
          <AutoBreadcrumb />

          <div className="bg-white rounded-lg shadow-lg p-6">
            <section className="form-container">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaEdit className="domain-icon" /> Edit Domain
              </h2>

              {/* Tabs */}
              <div className="flex mb-6 tab-buttons gap-2">
                <button
                  type="button"
                  className={`btn btn-outline ${
                    selectedOption === "update-info" ? "btn-active" : ""
                  }`}
                  onClick={() => setSelectedOption("update-info")}
                >
                  Domain Info
                </button>
                <button
                  type="button"
                  className={`btn btn-outline ${
                    selectedOption === "ssh" ? "btn-active" : ""
                  }`}
                  onClick={() => setSelectedOption("ssh")}
                >
                  SSH Details
                </button>
                <button
                  type="button"
                  className={`btn btn-outline ${
                    selectedOption === "hosting" ? "btn-active" : ""
                  }`}
                  onClick={() => setSelectedOption("hosting")}
                >
                  Hosting Details
                </button>
              </div>

              {/* -------- Forms -------- */}

              {/* 1. DOMAIN INFO */}
              {selectedOption === "update-info" && (
                <form onSubmit={handleSubmitDomainInfo} className="space-y-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium mb-1">
                      Domain Name
                    </label>
                    <input
                      className="w-full border p-2 rounded"
                      name="domainName"
                      value={formData.domainName}
                      onChange={handleChange}
                      required
                    />
                    {errors.domainName && (
                      <p className="error-message text-red-500 text-sm">
                        {errors.domainName}
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="block text-sm font-medium mb-1">
                      Client Name
                    </label>
                    <input
                      className="w-full border p-2 rounded"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      required
                    />
                    {errors.clientName && (
                      <p className="error-message text-red-500 text-sm">
                        {errors.clientName}
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="block text-sm font-medium mb-1">
                      Registrar
                    </label>
                    <input
                      className="w-full border p-2 rounded"
                      name="registrar"
                      value={formData.registrar}
                      onChange={handleChange}
                    />
                  </div>

                  {/* RADIO BUTTONS -> boolean true/false */}
                  <div className="form-group">
                    <label className="block text-sm font-medium mb-1">
                      Status
                    </label>
                    <div className="radio-group">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="activeStatus"
                          value="true"
                          checked={formData.activeStatus === true}
                          onChange={handleChange}
                        />
                        <span>Active</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="activeStatus"
                          value="false"
                          checked={formData.activeStatus === false}
                          onChange={handleChange}
                        />
                        <span>Inactive</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="block text-sm font-medium mb-1">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        className="w-full border p-2 rounded"
                        name="purchaseDate"
                        value={formData.purchaseDate}
                        min={minDate}
                        max={maxDateToday}
                        onChange={handleChange}
                        required
                      />
                      {errors.purchaseDate && (
                        <p className="error-message text-red-500 text-sm">
                          {errors.purchaseDate}
                        </p>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        className="w-full border p-2 rounded"
                        name="expiryDate"
                        value={formData.expiryDate}
                        min={formData.purchaseDate || minDate}
                        onChange={handleChange}
                        required
                      />
                      {errors.expiryDate && (
                        <p className="error-message text-red-500 text-sm">
                          {errors.expiryDate}
                        </p>
                      )}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-secondary">
                    <FaEdit /> Update Domain Info
                  </button>
                </form>
              )}

              {/* 2. SSH DETAILS */}
              {selectedOption === "ssh" && (
                <form onSubmit={handleSubmitSSH} className="space-y-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium mb-1">
                      SSH Name
                    </label>
                    <input
                      className="w-full border p-2 rounded"
                      name="sshName"
                      value={formData.sshName}
                      onChange={handleChange}
                      required
                    />
                    {errors.sshName && (
                      <p className="error-message text-red-500 text-sm">
                        {errors.sshName}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="block text-sm font-medium mb-1">
                        SSH Purchase Date
                      </label>
                      <input
                        type="date"
                        className="w-full border p-2 rounded"
                        name="sshPurchaseDate"
                        value={formData.sshPurchaseDate}
                        min={minDate}
                        max={maxDateToday}
                        onChange={handleChange}
                        required
                      />
                      {errors.sshPurchaseDate && (
                        <p className="error-message text-red-500 text-sm">
                          {errors.sshPurchaseDate}
                        </p>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium mb-1">
                        SSH Expiry Date
                      </label>
                      <input
                        type="date"
                        className="w-full border p-2 rounded"
                        name="sshExpiryDate"
                        value={formData.sshExpiryDate}
                        min={formData.sshPurchaseDate || minDate}
                        onChange={handleChange}
                        required
                      />
                      {errors.sshExpiryDate && (
                        <p className="error-message text-red-500 text-sm">
                          {errors.sshExpiryDate}
                        </p>
                      )}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-secondary mt-2">
                    <FaEdit /> Update SSH Details
                  </button>
                </form>
              )}

              {/* 3. HOSTING DETAILS */}
              {selectedOption === "hosting" && (
                <form onSubmit={handleSubmitHosting} className="space-y-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium mb-1">
                      Hosting Name
                    </label>
                    <input
                      className="w-full border p-2 rounded"
                      name="hostingName"
                      value={formData.hostingName}
                      onChange={handleChange}
                      required
                    />
                    {errors.hostingName && (
                      <p className="error-message text-red-500 text-sm">
                        {errors.hostingName}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="block text-sm font-medium mb-1">
                        Hosting Purchase Date
                      </label>
                      <input
                        type="date"
                        className="w-full border p-2 rounded"
                        name="hostingPurchaseDate"
                        value={formData.hostingPurchaseDate}
                        min={minDate}
                        max={maxDateToday}
                        onChange={handleChange}
                        required
                      />
                      {errors.hostingPurchaseDate && (
                        <p className="error-message text-red-500 text-sm">
                          {errors.hostingPurchaseDate}
                        </p>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium mb-1">
                        Hosting Expiry Date
                      </label>
                      <input
                        type="date"
                        className="w-full border p-2 rounded"
                        name="hostingExpiryDate"
                        value={formData.hostingExpiryDate}
                        min={formData.hostingPurchaseDate || minDate}
                        onChange={handleChange}
                        required
                      />
                      {errors.hostingExpiryDate && (
                        <p className="error-message text-red-500 text-sm">
                          {errors.hostingExpiryDate}
                        </p>
                      )}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-secondary mt-2">
                    <FaEdit /> Update Hosting Details
                  </button>
                </form>
              )}

              <button
                type="button"
                className="btn btn-back flex items-center gap-2 text-gray-600 hover:text-black mt-4"
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft /> Back
              </button>
            </section>
          </div>
        </div>
      </main>

      {/* Popup component */}
      <Popup
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
        onConfirm={handleConfirm}
      />
      <Footer />
    </div>
  );
};

export default EditDomainPage;
