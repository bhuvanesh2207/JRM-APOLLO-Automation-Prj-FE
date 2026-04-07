import React, { useState, useRef } from "react";
import {
  FaPlusCircle,
  FaSave,
  FaRedo,
  FaArrowRight,
  FaArrowLeft,
} from "react-icons/fa";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import { useNavigate } from "react-router-dom";

const EmployeeForm = () => {
  const formRef = useRef(null);
  const navigate = useNavigate();

  const today = new Date();
  const minDate = "1950-01-01";
  const maxToday = today.toISOString().split("T")[0];

  const [currentStep, setCurrentStep] = useState(1);

  const initialFormData = {
    employee_id: "",
    full_name: "",
    designation: "",
    dob: "",
    date_of_joining: "",
    current_address: "",
    permanent_address: "",
    primary_contact_no: "",
    alt_contact_no: "",
    email: "",
    salary: "",
    status: "active",

    aadhaar_card: null,
    pan: null,
    photo: null,

    blood_group: "",
    emergency_contact_person: "",
    emergency_contact_no: "",
    emergency_relationship: "",
    medical_conditions: "",

    bank_name: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    bank_branch: "",
    account_type: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const [popupConfig, setPopupConfig] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Cancel",
    showCancel: false,
    onConfirm: null,
  });

  const openPopup = (config) =>
    setPopupConfig({
      show: true,
      type: "info",
      title: "",
      message: "",
      confirmText: "OK",
      cancelText: "Cancel",
      showCancel: false,
      onConfirm: null,
      ...config,
    });

  const closePopup = () => setPopupConfig((p) => ({ ...p, show: false }));

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "file" ? files[0] : value,
    }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleReset = () => {
    openPopup({
      type: "warning",
      title: "Reset Form",
      message: "Are you sure you want to clear all fields and start over?",
      showCancel: true,
      confirmText: "Yes, Reset",
      onConfirm: () => {
        setFormData(initialFormData);
        setErrors({});
        setCurrentStep(1);
        closePopup();
      },
    });
  };

  const phoneRegex = /^[6-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;

  const validateStep = (step) => {
    const e = {};

    if (step === 1) {
      if (!formData.employee_id.trim())
        e.employee_id = "Employee ID is required.";
      if (!formData.full_name.trim()) e.full_name = "Full name is required.";
      if (!formData.designation) e.designation = "Designation is required.";
      if (!formData.dob) e.dob = "Date of birth is required.";
      if (!formData.date_of_joining)
        e.date_of_joining = "Date of joining is required.";
      if (!formData.current_address.trim())
        e.current_address = "Current address is required.";
      if (!formData.primary_contact_no.trim())
        e.primary_contact_no = "Primary contact number is required.";
      else if (!phoneRegex.test(formData.primary_contact_no.trim()))
        e.primary_contact_no = "Enter a valid 10-digit mobile number.";
      if (!formData.alt_contact_no.trim())
        e.alt_contact_no = "Alternate contact number is required.";
      else if (!phoneRegex.test(formData.alt_contact_no.trim()))
        e.alt_contact_no = "Enter a valid 10-digit mobile number.";
      if (!formData.email.trim()) e.email = "Email is required.";
      else if (!emailRegex.test(formData.email.trim()))
        e.email = "Enter a valid email address.";
      if (
        formData.salary &&
        (isNaN(formData.salary) || Number(formData.salary) <= 0)
      )
        e.salary = "Enter a valid salary amount.";
      if (
        formData.dob &&
        formData.date_of_joining &&
        new Date(formData.date_of_joining) <= new Date(formData.dob)
      )
        e.date_of_joining = "Date of joining must be after date of birth.";
    }

    if (step === 2) {
      if (!formData.aadhaar_card)
        e.aadhaar_card = "Aadhaar card upload is required.";
      if (!formData.pan) e.pan = "PAN card upload is required.";
      if (!formData.photo) e.photo = "Professional photo is required.";
    }

    if (step === 3) {
      if (!formData.blood_group) e.blood_group = "Blood group is required.";
      if (!formData.emergency_contact_person.trim())
        e.emergency_contact_person = "Emergency contact person is required.";
      if (!formData.emergency_contact_no.trim())
        e.emergency_contact_no = "Emergency contact number is required.";
      else if (!phoneRegex.test(formData.emergency_contact_no.trim()))
        e.emergency_contact_no = "Enter a valid 10-digit mobile number.";
      if (!formData.emergency_relationship.trim())
        e.emergency_relationship = "Relationship is required.";
    }

    if (step === 4) {
      if (
        formData.account_number &&
        !/^\d+$/.test(formData.account_number.trim())
      )
        e.account_number = "Account number must contain only digits.";
      if (formData.ifsc_code && !ifscRegex.test(formData.ifsc_code.trim()))
        e.ifsc_code = "Enter a valid IFSC code (e.g. SBIN0001234).";
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

  const handlePrev = () => {
    setErrors({});
    setCurrentStep((p) => p - 1);
  };

  const handleSubmit = async () => {
    const finalErrors = validateStep(4);
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      openPopup({
        type: "error",
        title: "Validation Failed",
        message: "Please fix the errors before submitting.",
      });
      return;
    }

    const form = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== "") {
        form.append(key, formData[key]);
      }
    });

    try {
      await api.post("/api/employees/add/", form);
      openPopup({
        type: "success",
        title: "Employee Added Successfully!",
        message: "The employee record has been saved.",
        confirmText: "Go to List",
        showCancel: true,
        cancelText: "Add Another",
        onConfirm: () => navigate("/employees/all"),
      });
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : err.response?.data?.error || "Failed to add employee.";
      openPopup({ type: "error", title: "Failed to Save", message: msg });
    }
  };

  const steps = ["Personal", "Documents", "Emergency", "Bank"];

  const FileField = ({ name, label, required, accept = "*" }) => (
    <div className="ef-field">
      <label className={required ? "required" : ""}>{label}</label>
      <div className="ef-file-wrapper">
        <input
          type="file"
          name={name}
          accept={accept}
          onChange={handleChange}
        />
        {formData[name] && (
          <span className="ef-file-name">📎 {formData[name].name}</span>
        )}
      </div>
      {errors[name] && <p className="error-message">{errors[name]}</p>}
    </div>
  );

  return (
    <>
      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AutoBreadcrumb />
          <div className="bg-white rounded-lg shadow-lg p-6">
            <section className="ef-section" ref={formRef}>
              <h2 className="ef-heading">
                <FaPlusCircle className="ef-icon" />
                {currentStep === 1 && "Personal Details"}
                {currentStep === 2 && "Document Uploads"}
                {currentStep === 3 && "Emergency & Medical"}
                {currentStep === 4 && "Bank / Account Details"}
                <span className="step-indicator">(Step {currentStep}/4)</span>
              </h2>

              <div className="ef-stepper">
                {steps.map((label, i) => {
                  const num = i + 1;
                  const active = num === currentStep;
                  const done = num < currentStep;
                  return (
                    <React.Fragment key={label}>
                      <div
                        className={`ef-step${active ? " ef-step--active" : ""}${done ? " ef-step--done" : ""}`}
                      >
                        <div className="ef-step-circle">{done ? "✓" : num}</div>
                        <span className="ef-step-label">{label}</span>
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          className={`ef-step-line${done ? " ef-step-line--done" : ""}`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <form onSubmit={(e) => e.preventDefault()} noValidate>
                {/* STEP 1 — PERSONAL */}
                {currentStep === 1 && (
                  <>
                    <div className="ef-row">
                      <div className="ef-field">
                        <label className="required">Employee ID</label>
                        <input
                          type="text"
                          name="employee_id"
                          placeholder="e.g. EMP001"
                          value={formData.employee_id}
                          onChange={handleChange}
                        />
                        {errors.employee_id && (
                          <p className="error-message">{errors.employee_id}</p>
                        )}
                      </div>
                      <div className="ef-field">
                        <label className="required">Full Name</label>
                        <input
                          type="text"
                          name="full_name"
                          placeholder="Enter full name"
                          value={formData.full_name}
                          onChange={handleChange}
                        />
                        {errors.full_name && (
                          <p className="error-message">{errors.full_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="ef-row">
                      <div className="ef-field">
                        <label className="required">Designation</label>
                        <select
                          name="designation"
                          value={formData.designation}
                          onChange={handleChange}
                        >
                          <option value="">-- Select Designation --</option>
                          <option value="software_developer">
                            Software Developer
                          </option>
                          <option value="graphic_designer">
                            Graphic Designer
                          </option>
                          <option value="web_designer">Web Designer</option>
                          <option value="ui_ux_designer">UI/UX Designer</option>
                          <option value="business_analyst">
                            Business Analyst
                          </option>
                        </select>
                        {errors.designation && (
                          <p className="error-message">{errors.designation}</p>
                        )}
                      </div>
                      <div className="ef-field">
                        <label>Status</label>
                        <div className="radio-group">
                          <label>
                            <input
                              type="radio"
                              name="status"
                              checked={formData.status === "active"}
                              onChange={() =>
                                setFormData({ ...formData, status: "active" })
                              }
                            />
                            Active
                          </label>
                          <label>
                            <input
                              type="radio"
                              name="status"
                              checked={formData.status === "inactive"}
                              onChange={() =>
                                setFormData({ ...formData, status: "inactive" })
                              }
                            />
                            Inactive
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="ef-row">
                      <div className="ef-field">
                        <label className="required">Date of Birth</label>
                        <input
                          type="date"
                          name="dob"
                          min={minDate}
                          max={maxToday}
                          value={formData.dob}
                          onChange={handleChange}
                        />
                        {errors.dob && (
                          <p className="error-message">{errors.dob}</p>
                        )}
                      </div>
                      <div className="ef-field">
                        <label className="required">Date of Joining</label>
                        <input
                          type="date"
                          name="date_of_joining"
                          min={minDate}
                          max={maxToday}
                          value={formData.date_of_joining}
                          onChange={handleChange}
                        />
                        {errors.date_of_joining && (
                          <p className="error-message">
                            {errors.date_of_joining}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="ef-row">
                      <div className="ef-field">
                        <label className="required">Email ID</label>
                        <input
                          type="email"
                          name="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChange={handleChange}
                        />
                        {errors.email && (
                          <p className="error-message">{errors.email}</p>
                        )}
                      </div>
                      <div className="ef-field">
                        <label className="required">Salary (₹)</label>
                        <input
                          type="number"
                          name="salary"
                          placeholder="e.g. 50000"
                          value={formData.salary}
                          onChange={handleChange}
                        />
                        {errors.salary && (
                          <p className="error-message">{errors.salary}</p>
                        )}
                      </div>
                    </div>

                    <div className="ef-row">
                      <div className="ef-field">
                        <label className="required">
                          Primary Contact Number
                        </label>
                        <input
                          type="text"
                          name="primary_contact_no"
                          placeholder="10-digit mobile number"
                          value={formData.primary_contact_no}
                          onChange={handleChange}
                        />
                        {errors.primary_contact_no && (
                          <p className="error-message">
                            {errors.primary_contact_no}
                          </p>
                        )}
                      </div>
                      <div className="ef-field">
                        <label className="required">
                          Alternate Contact Number
                        </label>
                        <input
                          type="text"
                          name="alt_contact_no"
                          placeholder="10-digit mobile number"
                          value={formData.alt_contact_no}
                          onChange={handleChange}
                        />
                        {errors.alt_contact_no && (
                          <p className="error-message">
                            {errors.alt_contact_no}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="ef-field ef-field-full">
                      <label className="required">Current Address</label>
                      <textarea
                        name="current_address"
                        placeholder="Enter current address"
                        rows={3}
                        value={formData.current_address}
                        onChange={handleChange}
                      />
                      {errors.current_address && (
                        <p className="error-message">
                          {errors.current_address}
                        </p>
                      )}
                    </div>

                    <div className="ef-field ef-field-full">
                      <label>Permanent Address</label>
                      <textarea
                        name="permanent_address"
                        placeholder="Enter permanent address"
                        rows={3}
                        value={formData.permanent_address}
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}

                {/* STEP 2 — DOCUMENTS */}
                {currentStep === 2 && (
                  <>
                    <h3 className="section-title">Upload Documents</h3>
                    <p className="section-hint">
                      Accepted formats: PDF, JPG, PNG &nbsp;·&nbsp; Max size: 5
                      MB per file
                    </p>

                    <div className="ef-row">
                      <FileField
                        name="aadhaar_card"
                        label="Aadhaar Card Upload"
                        required
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <FileField
                        name="pan"
                        label="PAN Card Upload"
                        required
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </div>

                    <div className="ef-row">
                      <FileField
                        name="photo"
                        label="Professional Photo"
                        required
                        accept="image/*"
                      />
                      <div className="ef-field" />
                    </div>
                  </>
                )}

                {/* STEP 3 — EMERGENCY & MEDICAL */}
                {currentStep === 3 && (
                  <>
                    <h3 className="section-title">Emergency Contact Details</h3>

                    <div className="ef-row">
                      <div className="ef-field">
                        <label className="required">Blood Group</label>
                        <select
                          name="blood_group"
                          value={formData.blood_group}
                          onChange={handleChange}
                        >
                          <option value="">-- Select Blood Group --</option>
                          {[
                            "A+",
                            "A-",
                            "B+",
                            "B-",
                            "AB+",
                            "AB-",
                            "O+",
                            "O-",
                          ].map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))}
                        </select>
                        {errors.blood_group && (
                          <p className="error-message">{errors.blood_group}</p>
                        )}
                      </div>
                      <div className="ef-field">
                        <label className="required">
                          Emergency Contact Person
                        </label>
                        <input
                          type="text"
                          name="emergency_contact_person"
                          placeholder="Contact person's name"
                          value={formData.emergency_contact_person}
                          onChange={handleChange}
                        />
                        {errors.emergency_contact_person && (
                          <p className="error-message">
                            {errors.emergency_contact_person}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="ef-row">
                      <div className="ef-field">
                        <label className="required">
                          Emergency Contact Number
                        </label>
                        <input
                          type="text"
                          name="emergency_contact_no"
                          placeholder="10-digit mobile number"
                          value={formData.emergency_contact_no}
                          onChange={handleChange}
                        />
                        {errors.emergency_contact_no && (
                          <p className="error-message">
                            {errors.emergency_contact_no}
                          </p>
                        )}
                      </div>
                      <div className="ef-field">
                        <label className="required">
                          Emergency Contact – Relationship
                        </label>
                        <input
                          type="text"
                          name="emergency_relationship"
                          placeholder="e.g. Spouse, Parent, Sibling"
                          value={formData.emergency_relationship}
                          onChange={handleChange}
                        />
                        {errors.emergency_relationship && (
                          <p className="error-message">
                            {errors.emergency_relationship}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="ef-field ef-field-full">
                      <label>
                        Medical Conditions{" "}
                        <span className="ef-optional">(Optional)</span>
                      </label>
                      <textarea
                        name="medical_conditions"
                        rows={4}
                        placeholder="List any known medical conditions or allergies"
                        value={formData.medical_conditions}
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}

                {/* STEP 4 — BANK DETAILS */}
                {currentStep === 4 && (
                  <>
                    <h3 className="section-title">
                      Bank Account Details{" "}
                      <span className="ef-optional">(Optional)</span>
                    </h3>

                    <div className="ef-row">
                      <div className="ef-field">
                        <label>Bank Name</label>
                        <input
                          type="text"
                          name="bank_name"
                          placeholder="e.g. State Bank of India"
                          value={formData.bank_name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="ef-field">
                        <label>Account Holder Name</label>
                        <input
                          type="text"
                          name="account_holder_name"
                          placeholder="Name as per bank records"
                          value={formData.account_holder_name}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="ef-row">
                      <div className="ef-field">
                        <label>Account Number</label>
                        <input
                          type="text"
                          name="account_number"
                          placeholder="Enter account number"
                          value={formData.account_number}
                          onChange={handleChange}
                        />
                        {errors.account_number && (
                          <p className="error-message">
                            {errors.account_number}
                          </p>
                        )}
                      </div>
                      <div className="ef-field">
                        <label>IFSC Code</label>
                        <input
                          type="text"
                          name="ifsc_code"
                          placeholder="e.g. SBIN0001234"
                          value={formData.ifsc_code}
                          onChange={handleChange}
                          style={{ textTransform: "uppercase" }}
                        />
                        {errors.ifsc_code && (
                          <p className="error-message">{errors.ifsc_code}</p>
                        )}
                      </div>
                    </div>

                    <div className="ef-row">
                      <div className="ef-field">
                        <label>Bank Branch</label>
                        <input
                          type="text"
                          name="bank_branch"
                          placeholder="e.g. MG Road, Bengaluru"
                          value={formData.bank_branch}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="ef-field">
                        <label>Account Type</label>
                        <select
                          name="account_type"
                          value={formData.account_type}
                          onChange={handleChange}
                        >
                          <option value="">-- Select Type --</option>
                          <option value="savings">Savings</option>
                          <option value="current">Current</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Navigation */}
                <div className="ef-form-actions">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handlePrev}
                    >
                      <FaArrowLeft /> Previous
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="ef-actions-right">
                    {currentStep < 4 ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleNext}
                      >
                        Next <FaArrowRight />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-back"
                          onClick={handleReset}
                        >
                          <FaRedo /> Reset
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleSubmit}
                        >
                          <FaSave /> Save Employee
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

      <style>{`
        .ef-section { width: 100%; }
        .ef-heading {
          font-size: clamp(16px, 3vw, 20px); font-weight: 700;
          color: var(--primary, #0b91ac);
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; border-bottom: 2px solid var(--accent, #ff9800);
          margin-bottom: 8px; flex-wrap: wrap;
        }
        .ef-icon { color: var(--primary, #0b91ac); }
        .step-indicator { font-size: 14px; font-weight: 400; color: #888; margin-left: 4px; }

        .ef-stepper { display: flex; align-items: center;justify-content: center; margin: 20px 0 28px; flex-wrap: nowrap; }
        
        .ef-step { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
        .ef-step-circle {
          width: 34px; height: 34px; border-radius: 50%;
          background: #e0e0e0; color: #888; font-weight: 700; font-size: 14px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.3s, color 0.3s;
        }
        .ef-step--active .ef-step-circle { background: var(--primary, #0b91ac); color: #fff; }
        .ef-step--done   .ef-step-circle { background: #22c55e; color: #fff; }
        .ef-step-label { font-size: 12px; color: #888; font-weight: 500; }
        .ef-step--active .ef-step-label  { color: var(--primary, #0b91ac); font-weight: 700; }
        .ef-step--done   .ef-step-label  { color: #22c55e; }
        .ef-step-line {
          min-width: 40px; max-width: 100px; height: 2px; background: #e0e0e0;
          margin: 0 8px; margin-bottom: 18px; transition: background 0.3s;
        }
        .ef-step-line--done { background: #22c55e; }

        .ef-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .ef-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .ef-field-full { margin-bottom: 20px; }
        .ef-optional { font-size: 12px; color: #888; font-weight: 400; }

        .ef-section label { font-size: 13px; font-weight: 600; color: #444; }
        .ef-section label.required::after { content: " *"; color: #e53935; }

        .ef-section input,
        .ef-section select,
        .ef-section textarea {
          width: 100% !important; max-width: 100% !important; box-sizing: border-box !important;
        }

        .ef-file-wrapper { display: flex; flex-direction: column; gap: 4px; }
        .ef-file-name { font-size: 12px; color: #555; }

        .ef-section .radio-group {
          display: flex; flex-wrap: wrap; gap: 20px;
          align-items: center; padding-top: 10px; min-height: 42px;
        }
        .ef-section .radio-group label {
          display: flex; align-items: center; gap: 6px; font-weight: 500; cursor: pointer;
        }

        .section-title { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 6px; }
        .section-hint  { font-size: 12px; color: #888; margin-bottom: 18px; }
        .error-message { font-size: 12px; color: #e53935; margin: 0; }

        .ef-form-actions {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 28px; padding-top: 16px; border-top: 1px solid #eee;
          flex-wrap: wrap; gap: 12px;
        }
        .ef-actions-right { display: flex; gap: 12px; align-items: center; }

        @media (max-width: 767px) {
          .ef-row { grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; }
          .ef-field-full { margin-bottom: 16px; }
        }
        @media (max-width: 479px) {
          .ef-heading { font-size: 15px; }
          .ef-form-actions { flex-direction: column; align-items: stretch; }
          .ef-form-actions > div, .ef-actions-right { width: 100%; }
          .ef-actions-right { flex-direction: column; }
          .ef-actions-right .btn,
          .ef-form-actions > .btn { width: 100%; justify-content: center; }
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

export default EmployeeForm;
