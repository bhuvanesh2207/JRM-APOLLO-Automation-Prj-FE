import React, { useState, useRef, useEffect } from "react";
import { FaPlusCircle, FaSave, FaRedo, FaTrash } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../compomnents/Navbar";
import Sidebar from "../../compomnents/Sidebar";
import Footer from "../../compomnents/Footer";

import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const ClientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    company_name: "",
    address: "",
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const [popup, setPopup] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  const showPopup = (type, title, message, onConfirm = null) => {
    setPopup({ show: true, type, title, message, onConfirm });
  };

  const closePopup = () => {
    setPopup({
      show: false,
      type: "info",
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  const handleConfirm = () => {
    popup.onConfirm && popup.onConfirm();
    closePopup();
  };

  /* ---------------- LOAD CLIENT ---------------- */
  useEffect(() => {
    if (isEditMode) fetchClient();
  }, [id]);

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
    } catch (err) {
      showPopup("error", "Error", "Failed to load client details.");
    }
  };

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.company_name.trim())
      newErrors.company_name = "Company name is required";
    if (!formData.contact.trim())
      newErrors.contact = "Contact number is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- HANDLE CHANGE ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (submitError) setSubmitError("");
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    try {
      if (isEditMode) {
        await api.put(`/api/client/update/${id}/`, formData);
        showPopup("success", "Success", "Client updated successfully.", () =>
          navigate("/client/all"),
        );
      } else {
        await api.post("/api/client/add/", formData);
        showPopup("success", "Success", "Client created successfully.", () =>
          navigate("/client/all"),
        );
      }
    } catch {
      showPopup("error", "Error", "Failed to save client.");
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = () => {
    showPopup(
      "delete",
      "Delete Client",
      "Are you sure you want to delete this client? This action cannot be undone.",
      async () => {
        await api.delete(`/api/client/delete/${id}/`);
        showPopup("success", "Deleted", "Client deleted successfully.", () =>
          navigate("/client/all"),
        );
      },
    );
  };

  /* ---------------- RESET ---------------- */
  const handleReset = () => {
    setFormData({
      name: "",
      contact: "",
      email: "",
      company_name: "",
      address: "",
    });
    setErrors({});
    setSubmitError("");
  };

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
            <section className="form-container" ref={formRef}>
              <h2>
                <FaPlusCircle className="domain-icon" />{" "}
                {isEditMode ? "Edit Client" : "Add New Client"}
              </h2>

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group date-group">
                  <div>
                    <label className="required">Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter client name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                    {errors.name && (
                      <p className="error-message">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="required">Company Name</label>
                    <input
                      type="text"
                      name="company_name"
                      placeholder="Enter company name"
                      value={formData.company_name}
                      onChange={handleChange}
                    />
                    {errors.company_name && (
                      <p className="error-message">{errors.company_name}</p>
                    )}
                  </div>
                </div>

                <div className="form-group date-group">
                  <div>
                    <label className="required">Contact</label>
                    <input
                      type="text"
                      name="contact"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.contact}
                      onChange={handleChange}
                    />
                    {errors.contact && (
                      <p className="error-message">{errors.contact}</p>
                    )}
                  </div>

                  <div>
                    <label className="required">Email</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="example@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isEditMode}
                    />
                    {errors.email && (
                      <p className="error-message">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="required">Address</label>
                  <textarea
                    name="address"
                    placeholder="Enter full client address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                  />
                  {errors.address && (
                    <p className="error-message">{errors.address}</p>
                  )}
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-secondary">
                    <FaSave /> {isEditMode ? "Update Client" : "Save Client"}
                  </button>

                  {!isEditMode && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleReset}
                    >
                      <FaRedo /> Reset
                    </button>
                  )}
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>

      <Popup
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
        onConfirm={handleConfirm}
        confirmText={popup.type === "delete" ? "Delete" : "OK"}
        cancelText="Cancel"
        showCancel={popup.type === "delete"}
      />
      <Footer />
    </div>
  );
};

export default ClientForm;
