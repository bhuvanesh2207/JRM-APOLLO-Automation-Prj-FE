import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaEdit, FaArrowLeft, FaArrowRight, FaSave } from "react-icons/fa";

import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const STEPS = [
  { key: "personal",  label: "Personal"   },
  { key: "documents", label: "Documents"  },
  { key: "emergency", label: "Emergency"  },
  { key: "bank",      label: "Bank"       },
];

const DESIGNATIONS = [
  { value: "software_developer", label: "Software Developer" },
  { value: "graphic_designer",   label: "Graphic Designer"   },
  { value: "web_designer",       label: "Web Designer"       },
  { value: "ui_ux_designer",     label: "UI/UX Designer"     },
  { value: "business_analyst",   label: "Business Analyst"   },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const today   = new Date();
  const minDate = "1950-01-01";
  const maxToday = today.toISOString().split("T")[0];

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [errors, setErrors]           = useState({});

  const [personal, setPersonal] = useState({
    employee_id: "", full_name: "", designation: "",
    dob: "", date_of_joining: "",
    current_address: "", permanent_address: "",
    primary_contact_no: "", alt_contact_no: "",
    email: "", salary: "", status: "active",
  });

  const [documents, setDocuments] = useState({
    aadhaar_card: null, pan: null, photo: null,
    aadhaar_card_url: "", pan_url: "", photo_url: "",
  });

  const [emergency, setEmergency] = useState({
    blood_group: "",
    emergency_contact_person: "",
    emergency_contact_no: "",
    emergency_relationship: "",
    medical_conditions: "",
  });

  const [bank, setBank] = useState({
    bank_name: "", account_holder_name: "",
    account_number: "", ifsc_code: "",
    bank_branch: "", account_type: "",
  });

  const [popup, setPopup] = useState({
    show: false, type: "info", title: "", message: "", onConfirm: null,
  });
  const showPopup = (type, title, message, onConfirm = null) =>
    setPopup({ show: true, type, title, message, onConfirm });
  const closePopup = () => setPopup((p) => ({ ...p, show: false }));
  const handleConfirm = () => { popup.onConfirm?.(); closePopup(); };

  /* ── Fetch ── */
  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/employees/${id}/`);
        const d = res.data.employee || res.data;

        setPersonal({
          employee_id:        d.employee_id        || "",
          full_name:          d.full_name          || "",
          designation:        d.designation        || "",
          dob:                d.dob                || "",
          date_of_joining:    d.date_of_joining    || "",
          current_address:    d.current_address    || "",
          permanent_address:  d.permanent_address  || "",
          primary_contact_no: d.primary_contact_no || "",
          alt_contact_no:     d.alt_contact_no     || "",
          email:              d.email              || "",
          salary:             d.salary             || "",
          status:             d.status             || "active",
        });

        setDocuments({
          aadhaar_card: null, pan: null, photo: null,
          aadhaar_card_url: d.aadhaar_card_url || d.aadhaar_card || "",
          pan_url:          d.pan_url          || d.pan          || "",
          photo_url:        d.photo_url        || d.photo        || "",
        });

        setEmergency({
          blood_group:              d.blood_group              || "",
          emergency_contact_person: d.emergency_contact_person || "",
          emergency_contact_no:     d.emergency_contact_no     || "",
          emergency_relationship:   d.emergency_relationship   || "",
          medical_conditions:       d.medical_conditions       || "",
        });

        setBank({
          bank_name:           d.bank_name           || "",
          account_holder_name: d.account_holder_name || "",
          account_number:      d.account_number      || "",
          ifsc_code:           d.ifsc_code           || "",
          bank_branch:         d.bank_branch         || "",
          account_type:        d.account_type        || "",
        });
      } catch {
        setError("Failed to fetch employee details.");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  /* ── Generic change handlers ── */
  const makeHandler = (setter) => (e) => {
    const { name, value, type, files } = e.target;
    setter((p) => ({ ...p, [name]: type === "file" ? files[0] : value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handlePersonalChange  = makeHandler(setPersonal);
  const handleDocumentChange  = makeHandler(setDocuments);
  const handleEmergencyChange = makeHandler(setEmergency);
  const handleBankChange      = makeHandler(setBank);

  /* ── Validation ── */
  const phoneRegex = /^[6-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const ifscRegex  = /^[A-Z]{4}0[A-Z0-9]{6}$/i;

  const validateStep = (step) => {
    const e = {};

    if (step === 1) {
      if (!personal.employee_id.trim())        e.employee_id        = "Employee ID is required.";
      if (!personal.full_name.trim())          e.full_name          = "Full name is required.";
      if (!personal.designation)               e.designation        = "Designation is required.";
      if (!personal.dob)                       e.dob                = "Date of birth is required.";
      if (!personal.date_of_joining)           e.date_of_joining    = "Date of joining is required.";
      if (!personal.current_address.trim())    e.current_address    = "Current address is required.";
      if (!personal.primary_contact_no.trim()) e.primary_contact_no = "Primary contact number is required.";
      else if (!phoneRegex.test(personal.primary_contact_no.trim()))
        e.primary_contact_no = "Enter a valid 10-digit mobile number.";
      if (!personal.alt_contact_no.trim())     e.alt_contact_no     = "Alternate contact number is required.";
      else if (!phoneRegex.test(personal.alt_contact_no.trim()))
        e.alt_contact_no = "Enter a valid 10-digit mobile number.";
      if (!personal.email.trim())              e.email              = "Email is required.";
      else if (!emailRegex.test(personal.email.trim())) e.email     = "Enter a valid email address.";
      if (personal.salary && (isNaN(personal.salary) || Number(personal.salary) <= 0))
        e.salary = "Enter a valid salary amount.";
      if (personal.dob && personal.date_of_joining &&
        new Date(personal.date_of_joining) <= new Date(personal.dob))
        e.date_of_joining = "Date of joining must be after date of birth.";
    }

    if (step === 2) {
      // On edit, files are only required if no existing file is present
      if (!documents.aadhaar_card && !documents.aadhaar_card_url)
        e.aadhaar_card = "Aadhaar card upload is required.";
      if (!documents.pan && !documents.pan_url)
        e.pan = "PAN card upload is required.";
      if (!documents.photo && !documents.photo_url)
        e.photo = "Professional photo is required.";
    }

    if (step === 3) {
      if (!emergency.blood_group)                     e.blood_group              = "Blood group is required.";
      if (!emergency.emergency_contact_person.trim()) e.emergency_contact_person = "Contact person is required.";
      if (!emergency.emergency_contact_no.trim())     e.emergency_contact_no     = "Contact number is required.";
      else if (!phoneRegex.test(emergency.emergency_contact_no.trim()))
        e.emergency_contact_no = "Enter a valid 10-digit mobile number.";
      if (!emergency.emergency_relationship.trim())   e.emergency_relationship   = "Relationship is required.";
    }

    if (step === 4) {
      if (bank.account_number && !/^\d+$/.test(bank.account_number.trim()))
        e.account_number = "Account number must contain only digits.";
      if (bank.ifsc_code && !ifscRegex.test(bank.ifsc_code.trim()))
        e.ifsc_code = "Enter a valid IFSC code (e.g. SBIN0001234).";
    }

    return e;
  };

  /* ── Step navigation ── */
  const handleNext = async () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      const first = Object.keys(stepErrors)[0];
      formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});

    // Save current step before advancing
    try {
      if (currentStep === 1) await savePersonal();
      if (currentStep === 2) await saveDocuments();
      if (currentStep === 3) await saveEmergency();
    } catch {
      return;
    }

    setCurrentStep((p) => p + 1);
  };

  const handlePrev = () => {
    setErrors({});
    setCurrentStep((p) => p - 1);
  };

  /* ── Save helpers ── */
  const savePersonal = async () => {
    const res = await api.patch(`/api/employees/update/${id}/`, {
      employee_id:        personal.employee_id,
      full_name:          personal.full_name,
      designation:        personal.designation        || null,
      dob:                personal.dob                || null,
      date_of_joining:    personal.date_of_joining    || null,
      current_address:    personal.current_address    || null,
      permanent_address:  personal.permanent_address  || null,
      primary_contact_no: personal.primary_contact_no || null,
      alt_contact_no:     personal.alt_contact_no     || null,
      email:              personal.email,
      salary:             personal.salary             || null,
      status:             personal.status,
    }).catch((err) => {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : "Server error. Could not update personal info.";
      showPopup("error", "Error", msg);
      throw err;
    });
    return res;
  };

  const saveDocuments = async () => {
    if (!documents.aadhaar_card && !documents.pan && !documents.photo) return;
    const form = new FormData();
    if (documents.aadhaar_card) form.append("aadhaar_card", documents.aadhaar_card);
    if (documents.pan)          form.append("pan",          documents.pan);
    if (documents.photo)        form.append("photo",        documents.photo);
    await api.patch(`/api/employees/update/${id}/`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).catch((err) => {
      showPopup("error", "Error", "Server error. Could not update documents.");
      throw err;
    });
  };

  const saveEmergency = async () => {
    await api.patch(`/api/employees/update/${id}/`, {
      blood_group:              emergency.blood_group,
      emergency_contact_person: emergency.emergency_contact_person,
      emergency_contact_no:     emergency.emergency_contact_no,
      emergency_relationship:   emergency.emergency_relationship,
      medical_conditions:       emergency.medical_conditions || null,
    }).catch((err) => {
      showPopup("error", "Error", "Server error. Could not update emergency info.");
      throw err;
    });
  };

  const saveBank = async () => {
    await api.patch(`/api/employees/update/${id}/`, {
      bank_name:           bank.bank_name           || null,
      account_holder_name: bank.account_holder_name || null,
      account_number:      bank.account_number      || null,
      ifsc_code:           bank.ifsc_code           || null,
      bank_branch:         bank.bank_branch         || null,
      account_type:        bank.account_type        || null,
    }).catch((err) => {
      showPopup("error", "Error", "Server error. Could not update bank details.");
      throw err;
    });
  };

  /* ── Final submit (step 4) ── */
  const handleSubmit = async () => {
    const stepErrors = validateStep(4);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    try {
      await saveBank();
      showPopup(
        "success",
        "Employee Updated",
        "All details have been saved successfully.",
        () => navigate(-1),
      );
    } catch {
      // error popup already shown inside saveBank
    }
  };

  /* ── File field helper ── */
  const FileField = ({ name, label, required, accept = "*", currentUrl }) => (
    <div className="ed-field">
      <label className={required ? "required" : ""}>{label}</label>
      {currentUrl && (
        <div className="ed-current-file">
          Current:&nbsp;
          <a href={currentUrl} target="_blank" rel="noreferrer" className="ed-file-link">
            View file
          </a>
        </div>
      )}
      <input type="file" name={name} accept={accept} onChange={handleDocumentChange} />
      {documents[name] && (
        <span className="ed-file-name">📎 {documents[name].name}</span>
      )}
      {errors[name] && <p className="error-message">{errors[name]}</p>}
    </div>
  );

  /* ── Guards ── */
  if (loading) return <div className="p-5">Loading employee details...</div>;
  if (error)   return <div className="p-5" style={{ color: "var(--error)" }}>{error}</div>;

  const stepTitles = [
    "Personal Details",
    "Document Uploads",
    "Emergency & Medical",
    "Bank / Account Details",
  ];

  /* ── Render ── */
  return (
    <>
      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ✅ Breadcrumb — renders: Dashboard > Employees > Edit Employee */}
          <AutoBreadcrumb />

          <div className="bg-white rounded-lg shadow-lg p-6">
            <section className="ed-section" ref={formRef}>

              {/* Heading */}
              <h2 className="ed-heading">
                <FaEdit className="domain-icon" />
                {stepTitles[currentStep - 1]}
                <span className="ed-emp-name">— {personal.full_name}</span>
                <span className="step-indicator">(Step {currentStep}/4)</span>
              </h2>

              {/* Stepper */}
              <div className="ed-stepper">
                {STEPS.map(({ key, label }, i) => {
                  const num    = i + 1;
                  const active = num === currentStep;
                  const done   = num < currentStep;
                  return (
                    <React.Fragment key={key}>
                      <div className={`ed-step${active ? " ed-step--active" : ""}${done ? " ed-step--done" : ""}`}>
                        <div className="ed-step-circle">{done ? "✓" : num}</div>
                        <span className="ed-step-label">{label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`ed-step-line${done ? " ed-step-line--done" : ""}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <form onSubmit={(e) => e.preventDefault()} noValidate>

                {/* ══ STEP 1 — PERSONAL ══ */}
                {currentStep === 1 && (
                  <>
                    <div className="ed-row">
                      <div className="ed-field">
                        <label className="required">Employee ID</label>
                        <input type="text" name="employee_id" placeholder="e.g. EMP001"
                          value={personal.employee_id} onChange={handlePersonalChange} />
                        {errors.employee_id && <p className="error-message">{errors.employee_id}</p>}
                      </div>
                      <div className="ed-field">
                        <label className="required">Full Name</label>
                        <input type="text" name="full_name" placeholder="Enter full name"
                          value={personal.full_name} onChange={handlePersonalChange} />
                        {errors.full_name && <p className="error-message">{errors.full_name}</p>}
                      </div>
                    </div>

                    <div className="ed-row">
                      <div className="ed-field">
                        <label className="required">Designation</label>
                        <select name="designation" value={personal.designation} onChange={handlePersonalChange}>
                          <option value="">-- Select Designation --</option>
                          {DESIGNATIONS.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                        {errors.designation && <p className="error-message">{errors.designation}</p>}
                      </div>
                      <div className="ed-field">
                        <label>Status</label>
                        <div className="radio-group ed-radio">
                          <label>
                            <input type="radio" name="status" value="active"
                              checked={personal.status === "active"}
                              onChange={handlePersonalChange} />
                            Active
                          </label>
                          <label>
                            <input type="radio" name="status" value="inactive"
                              checked={personal.status === "inactive"}
                              onChange={handlePersonalChange} />
                            Inactive
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="ed-row">
                      <div className="ed-field">
                        <label className="required">Date of Birth</label>
                        <input type="date" name="dob" min={minDate} max={maxToday}
                          value={personal.dob} onChange={handlePersonalChange} />
                        {errors.dob && <p className="error-message">{errors.dob}</p>}
                      </div>
                      <div className="ed-field">
                        <label className="required">Date of Joining</label>
                        <input type="date" name="date_of_joining" min={minDate} max={maxToday}
                          value={personal.date_of_joining} onChange={handlePersonalChange} />
                        {errors.date_of_joining && <p className="error-message">{errors.date_of_joining}</p>}
                      </div>
                    </div>

                    <div className="ed-row">
                      <div className="ed-field">
                        <label className="required">Email ID</label>
                        <input type="email" name="email" placeholder="email@example.com"
                          value={personal.email} onChange={handlePersonalChange} />
                        {errors.email && <p className="error-message">{errors.email}</p>}
                      </div>
                      <div className="ed-field">
                        <label>Salary (₹)</label>
                        <input type="number" name="salary" placeholder="e.g. 50000"
                          value={personal.salary} onChange={handlePersonalChange} />
                        {errors.salary && <p className="error-message">{errors.salary}</p>}
                      </div>
                    </div>

                    <div className="ed-row">
                      <div className="ed-field">
                        <label className="required">Primary Contact Number</label>
                        <input type="text" name="primary_contact_no" placeholder="10-digit mobile number"
                          value={personal.primary_contact_no} onChange={handlePersonalChange} />
                        {errors.primary_contact_no && <p className="error-message">{errors.primary_contact_no}</p>}
                      </div>
                      <div className="ed-field">
                        <label className="required">Alternate Contact Number</label>
                        <input type="text" name="alt_contact_no" placeholder="10-digit mobile number"
                          value={personal.alt_contact_no} onChange={handlePersonalChange} />
                        {errors.alt_contact_no && <p className="error-message">{errors.alt_contact_no}</p>}
                      </div>
                    </div>

                    <div className="ed-field ed-field-full">
                      <label className="required">Current Address</label>
                      <textarea name="current_address" rows={3} placeholder="Enter current address"
                        value={personal.current_address} onChange={handlePersonalChange} />
                      {errors.current_address && <p className="error-message">{errors.current_address}</p>}
                    </div>
                    <div className="ed-field ed-field-full">
                      <label>Permanent Address</label>
                      <textarea name="permanent_address" rows={3} placeholder="Enter permanent address"
                        value={personal.permanent_address} onChange={handlePersonalChange} />
                    </div>
                  </>
                )}

                {/* ══ STEP 2 — DOCUMENTS ══ */}
                {currentStep === 2 && (
                  <>
                    <h3 className="section-title">Upload New Files</h3>
                    <p className="section-hint">
                      Only upload a file if you want to replace the existing one.
                      Accepted: PDF, JPG, PNG &nbsp;·&nbsp; Max 5 MB per file.
                    </p>

                    <div className="ed-row">
                      <FileField name="aadhaar_card" label="Aadhaar Card Upload"
                        required
                        accept=".pdf,.jpg,.jpeg,.png"
                        currentUrl={documents.aadhaar_card_url} />
                      <FileField name="pan" label="PAN Card Upload"
                        required
                        accept=".pdf,.jpg,.jpeg,.png"
                        currentUrl={documents.pan_url} />
                    </div>

                    <div className="ed-row">
                      <FileField name="photo" label="Professional Photo"
                        required
                        accept="image/*"
                        currentUrl={documents.photo_url} />
                      <div className="ed-field" />
                    </div>
                  </>
                )}

                {/* ══ STEP 3 — EMERGENCY & MEDICAL ══ */}
                {currentStep === 3 && (
                  <>
                    <h3 className="section-title">Emergency Contact Details</h3>

                    <div className="ed-row">
                      <div className="ed-field">
                        <label className="required">Blood Group</label>
                        <select name="blood_group" value={emergency.blood_group} onChange={handleEmergencyChange}>
                          <option value="">-- Select Blood Group --</option>
                          {BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                        {errors.blood_group && <p className="error-message">{errors.blood_group}</p>}
                      </div>
                      <div className="ed-field">
                        <label className="required">Emergency Contact Person</label>
                        <input type="text" name="emergency_contact_person"
                          placeholder="Contact person's name"
                          value={emergency.emergency_contact_person} onChange={handleEmergencyChange} />
                        {errors.emergency_contact_person && <p className="error-message">{errors.emergency_contact_person}</p>}
                      </div>
                    </div>

                    <div className="ed-row">
                      <div className="ed-field">
                        <label className="required">Emergency Contact Number</label>
                        <input type="text" name="emergency_contact_no"
                          placeholder="10-digit mobile number"
                          value={emergency.emergency_contact_no} onChange={handleEmergencyChange} />
                        {errors.emergency_contact_no && <p className="error-message">{errors.emergency_contact_no}</p>}
                      </div>
                      <div className="ed-field">
                        <label className="required">Emergency Contact – Relationship</label>
                        <input type="text" name="emergency_relationship"
                          placeholder="e.g. Spouse, Parent, Sibling"
                          value={emergency.emergency_relationship} onChange={handleEmergencyChange} />
                        {errors.emergency_relationship && <p className="error-message">{errors.emergency_relationship}</p>}
                      </div>
                    </div>

                    <div className="ed-field ed-field-full">
                      <label>Medical Conditions <span className="ed-optional">(Optional)</span></label>
                      <textarea name="medical_conditions" rows={4}
                        placeholder="List any known medical conditions or allergies"
                        value={emergency.medical_conditions} onChange={handleEmergencyChange} />
                    </div>
                  </>
                )}

                {/* ══ STEP 4 — BANK DETAILS ══ */}
                {currentStep === 4 && (
                  <>
                    <h3 className="section-title">
                      Bank Account Details <span className="ed-optional">(Optional)</span>
                    </h3>

                    <div className="ed-row">
                      <div className="ed-field">
                        <label>Bank Name</label>
                        <input type="text" name="bank_name" placeholder="e.g. State Bank of India"
                          value={bank.bank_name} onChange={handleBankChange} />
                      </div>
                      <div className="ed-field">
                        <label>Account Holder Name</label>
                        <input type="text" name="account_holder_name" placeholder="Name as per bank records"
                          value={bank.account_holder_name} onChange={handleBankChange} />
                      </div>
                    </div>

                    <div className="ed-row">
                      <div className="ed-field">
                        <label>Account Number</label>
                        <input type="text" name="account_number" placeholder="Enter account number"
                          value={bank.account_number} onChange={handleBankChange} />
                        {errors.account_number && <p className="error-message">{errors.account_number}</p>}
                      </div>
                      <div className="ed-field">
                        <label>IFSC Code</label>
                        <input type="text" name="ifsc_code" placeholder="e.g. SBIN0001234"
                          value={bank.ifsc_code} onChange={handleBankChange}
                          style={{ textTransform: "uppercase" }} />
                        {errors.ifsc_code && <p className="error-message">{errors.ifsc_code}</p>}
                      </div>
                    </div>

                    <div className="ed-row">
                      <div className="ed-field">
                        <label>Bank Branch</label>
                        <input type="text" name="bank_branch" placeholder="e.g. MG Road, Bengaluru"
                          value={bank.bank_branch} onChange={handleBankChange} />
                      </div>
                      <div className="ed-field">
                        <label>Account Type</label>
                        <select name="account_type" value={bank.account_type} onChange={handleBankChange}>
                          <option value="">-- Select Type --</option>
                          <option value="savings">Savings</option>
                          <option value="current">Current</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* ══ Navigation ══ */}
                <div className="ed-form-actions">
                  {currentStep > 1 ? (
                    <button type="button" className="btn btn-secondary" onClick={handlePrev}>
                      <FaArrowLeft /> Previous
                    </button>
                  ) : (
                    <button type="button" className="btn btn-back" onClick={() => navigate(-1)}>
                      <FaArrowLeft /> Back
                    </button>
                  )}

                  <div className="ed-actions-right">
                    {currentStep < 4 ? (
                      <button type="button" className="btn btn-secondary" onClick={handleNext}>
                        Next <FaArrowRight />
                      </button>
                    ) : (
                      <button type="button" className="btn btn-secondary" onClick={handleSubmit}>
                        <FaSave /> Save Changes
                      </button>
                    )}
                  </div>
                </div>

              </form>
            </section>
          </div>
        </div>
      </main>

      {/* Scoped styles */}
      <style>{`
        .ed-section { width: 100%; }

        .ed-heading {
          font-size: clamp(16px, 3vw, 20px); font-weight: 700;
          color: var(--primary, #0b91ac);
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--accent, #ff9800);
          margin-bottom: 8px;
        }
        .ed-emp-name   { font-size: 15px; font-weight: 500; color: #555; }
        .step-indicator { font-size: 14px; font-weight: 400; color: #888; margin-left: 4px; }

        .ed-stepper {
         display: flex; align-items: center;justify-content: center; margin: 20px 0 28px; flex-wrap: nowrap; 
        }
        .ed-step {
          display: flex; flex-direction: column;
          align-items: center; gap: 6px; flex-shrink: 0;
        }
        .ed-step-circle {
          width: 34px; height: 34px; border-radius: 50%;
          background: #e0e0e0; color: #888;
          font-weight: 700; font-size: 14px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.3s, color 0.3s;
        }
        .ed-step--active .ed-step-circle { background: var(--primary, #0b91ac); color: #fff; }
        .ed-step--done   .ed-step-circle { background: #22c55e; color: #fff; }
        .ed-step-label   { font-size: 12px; color: #888; font-weight: 500; }
        .ed-step--active .ed-step-label  { color: var(--primary, #0b91ac); font-weight: 700; }
        .ed-step--done   .ed-step-label  { color: #22c55e; }
        .ed-step-line {
          min-width: 40px; max-width: 100px; height: 2px; background: #e0e0e0;
          margin: 0 8px; margin-bottom: 18px; transition: background 0.3s;
        }
        .ed-step-line--done { background: #22c55e; }

        .ed-row {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 20px; margin-bottom: 20px;
        }
        .ed-field       { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .ed-field-full  { margin-bottom: 20px; }
        .ed-optional    { font-size: 12px; color: #888; font-weight: 400; }

        .ed-section label { font-size: 13px; font-weight: 600; color: #444; }
        .ed-section label.required::after { content: " *"; color: #e53935; }

        .ed-section input,
        .ed-section select,
        .ed-section textarea {
          width: 100% !important; max-width: 100% !important;
          box-sizing: border-box !important;
        }

        .ed-radio {
          display: flex; flex-wrap: wrap; gap: 20px;
          align-items: center; padding-top: 10px; min-height: 42px;
        }
        .ed-radio label {
          display: flex; align-items: center; gap: 6px;
          font-weight: 500; cursor: pointer;
        }

        .ed-current-file { font-size: 12px; color: #555; margin-bottom: 4px; }
        .ed-file-link    { color: var(--primary, #0b91ac); text-decoration: underline; }
        .ed-file-name    { font-size: 12px; color: #555; }

        .section-title { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 6px; }
        .section-hint  { font-size: 12px; color: #888; margin-bottom: 18px; }
        .error-message { font-size: 12px; color: #e53935; margin: 0; }

        .ed-form-actions {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 28px; padding-top: 16px;
          border-top: 1px solid #eee;
          flex-wrap: wrap; gap: 12px;
        }
        .ed-actions-right { display: flex; gap: 12px; align-items: center; }

        @media (max-width: 767px) {
          .ed-row       { grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; }
          .ed-field-full { margin-bottom: 16px; }
        }
        @media (max-width: 479px) {
          .ed-heading { font-size: 15px; }
          .ed-form-actions { flex-direction: column; align-items: stretch; }
          .ed-form-actions > div,
          .ed-actions-right { width: 100%; }
          .ed-actions-right { flex-direction: column; }
          .ed-actions-right .btn,
          .ed-form-actions > .btn { width: 100%; justify-content: center; }
        }
      `}</style>

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

export default EditEmployeePage;