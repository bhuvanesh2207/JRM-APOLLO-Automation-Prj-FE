import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";
import { FaCalendarDay, FaCheckCircle, FaPlusCircle, FaTrash, FaPlus } from "react-icons/fa";

const TIMEZONE = import.meta.env.VITE_TIMEZONE;

// ── API helper ────────────────────────────────────────────────
const addHoliday = (payload) =>
  api.post("/api/attendance/holiday/add/", payload).then((r) => r.data);

// ── Helpers ───────────────────────────────────────────────────
const slugify = (str) =>
  str.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

const currentYear = new Date().getFullYear();

const autoGroupId = (name) => {
  const slug = slugify(name);
  return slug ? `${slug}_${currentYear}` : "";
};

// ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  day_type: "HOLIDAY",
  date: "",
  dates: [""],
  group_id: "",
  max_allowed_leaves: "",
};

export default function AddHolidayForm() {
  const formRef = useRef(null);
  const navigate = useNavigate();

  const [form,          setForm]          = useState(EMPTY_FORM);
  const [errors,        setErrors]        = useState({});
  const [loading,       setLoading]       = useState(false);
  const [groupIdManual, setGroupIdManual] = useState(false);

  // ── Popup ─────────────────────────────────────────────────────
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

  const isFestival = form.day_type === "FESTIVAL";

  // ── Auto-suggest group_id from name ──────────────────────────
  useEffect(() => {
    if (!groupIdManual && isFestival) {
      setForm((prev) => ({ ...prev, group_id: autoGroupId(prev.name) }));
    }
  }, [form.name, isFestival, groupIdManual]);

  useEffect(() => {
    if (!isFestival) setGroupIdManual(false);
  }, [isFestival]);

  // ── Field change handlers ─────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleGroupIdChange = (e) => {
    setGroupIdManual(true);
    setForm((prev) => ({ ...prev, group_id: e.target.value.toUpperCase() }));
    if (errors.group_id) setErrors((prev) => ({ ...prev, group_id: "" }));
  };

  // ── Date-array handlers ───────────────────────────────────────
  const handleDateChange = (index, value) => {
    setForm((prev) => {
      const updated = [...prev.dates];
      updated[index] = value;
      return { ...prev, dates: updated };
    });
    setErrors((prev) => {
      const dateErrs = Array.isArray(prev.dates) ? [...prev.dates] : [];
      dateErrs[index] = "";
      return { ...prev, dates: dateErrs };
    });
  };

  const addDateRow = () => {
    setForm((prev) => ({ ...prev, dates: [...prev.dates, ""] }));
  };

  const removeDateRow = (index) => {
    setForm((prev) => {
      const updated = prev.dates.filter((_, i) => i !== index);
      return { ...prev, dates: updated.length ? updated : [""] };
    });
    setErrors((prev) => {
      const dateErrs = Array.isArray(prev.dates) ? prev.dates.filter((_, i) => i !== index) : [];
      return { ...prev, dates: dateErrs };
    });
  };

  // ── Validation ────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";

    if (!isFestival) {
      if (!form.date) errs.date = "Date is required.";
    } else {
      const dateErrs = form.dates.map((d) => (d ? "" : "Date is required."));
      const seen = {};
      form.dates.forEach((d, i) => {
        if (!d) return;
        if (seen[d] !== undefined) {
          dateErrs[i]       = "Duplicate date.";
          dateErrs[seen[d]] = "Duplicate date.";
        } else {
          seen[d] = i;
        }
      });
      if (dateErrs.some(Boolean)) errs.dates = dateErrs;
      if (!form.group_id.trim())  errs.group_id = "Group ID is required for festivals.";
      if (form.max_allowed_leaves === "")
        errs.max_allowed_leaves = "Max allowed leaves is required for festivals.";
    }

    if (
      form.max_allowed_leaves !== "" &&
      (isNaN(form.max_allowed_leaves) || Number(form.max_allowed_leaves) < 0)
    ) {
      errs.max_allowed_leaves = "Must be a non-negative number.";
    }

    return errs;
  };

  // ── Reset ─────────────────────────────────────────────────────
  const handleReset = () => {
    openPopup({
      type: "warning", title: "Reset Form",
      message: "Are you sure you want to reset all fields?",
      showCancel: true, confirmText: "Reset", cancelText: "Cancel",
      onConfirm: () => {
        setForm(EMPTY_FORM);
        setErrors({});
        setGroupIdManual(false);
        closePopup();
      },
    });
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      openPopup({
        type: "error", title: "Validation Error",
        message: "Please fix the errors in the form before submitting.",
      });
      formRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setLoading(true);

    const payload = isFestival
      ? {
          name:               form.name.trim(),
          day_type:           "FESTIVAL",
          dates:              form.dates,
          group_id:           form.group_id.trim().toUpperCase(),
          max_allowed_leaves: Number(form.max_allowed_leaves),
        }
      : {
          name:     form.name.trim(),
          day_type: "HOLIDAY",
          date:     form.date,
          ...(form.max_allowed_leaves !== "" && {
            max_allowed_leaves: Number(form.max_allowed_leaves),
          }),
        };

    try {
      const res = await addHoliday(payload);
      openPopup({
        type: "success", title: "Success!",
        message: res.message || "Saved successfully.",
        onConfirm: () => { closePopup(); navigate("/attendance/calendar"); },
      });
      setForm(EMPTY_FORM);
      setGroupIdManual(false);
      setErrors({});
    } catch (err) {
      const apiMsg =
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : err.response?.data?.message || err.message;
      openPopup({ type: "error", title: "Save Failed", message: apiMsg });
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────
  const dateFieldError = (index) =>
    Array.isArray(errors.dates) ? errors.dates[index] || "" : "";

  const validDates = isFestival
    ? form.dates.filter((d) => d).sort()
    : form.date
    ? [form.date]
    : [];

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AutoBreadcrumb />

          <div className="bg-white rounded-lg shadow-lg p-6">
            <section ref={formRef}>
              <h2 className="section-heading">
                <FaCalendarDay className="domain-icon" style={{ fontSize: 20 }} />
                Add Holiday / Festival
              </h2>

              <form onSubmit={handleSubmit} noValidate>
                {/* ── Name + single date ── */}
                <div className="ed-row">
                  <div className="ed-field">
                    <label htmlFor="name" className="required">Holiday / Festival Name</label>
                    <input
                      id="name" name="name" type="text"
                      placeholder="e.g. Pongal, Independence Day"
                      value={form.name} onChange={handleChange}
                      className={errors.name ? "is-invalid" : ""}
                    />
                    {errors.name && <p className="error-message">{errors.name}</p>}
                  </div>

                  {!isFestival && (
                    <div className="ed-field">
                      <label htmlFor="date" className="required">Date</label>
                      <input
                        id="date" name="date" type="date"
                        value={form.date} onChange={handleChange}
                        className={errors.date ? "is-invalid" : ""}
                      />
                      {errors.date && <p className="error-message">{errors.date}</p>}
                    </div>
                  )}
                </div>

                {/* ── Day Type ── */}
                <div className="ed-field ed-field-full">
                  <label className="required">Day Type</label>
                  <div className="radio-group ed-radio">
                    {["HOLIDAY", "FESTIVAL"].map((type) => (
                      <label key={type}>
                        <input
                          type="radio" name="day_type" value={type}
                          checked={form.day_type === type} onChange={handleChange}
                        />
                        {type === "HOLIDAY" ? "Holiday" : "Festival"}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ── Festival-only fields ── */}
                {isFestival && (
                  <>
                    <div className="ed-row">
                      <div className="ed-field">
                        <label htmlFor="group_id" className="required">Group ID</label>
                        <input
                          id="group_id" name="group_id" type="text"
                          placeholder="e.g. PONGAL_2026"
                          value={form.group_id} onChange={handleGroupIdChange}
                          className={errors.group_id ? "is-invalid" : ""}
                          style={{ textTransform: "uppercase" }}
                        />
                        {errors.group_id
                          ? <p className="error-message">{errors.group_id}</p>
                          : <span className="form-note">
                              All dates in the same festival share one Group ID.
                              Auto-suggested from name — edit if needed.
                            </span>
                        }
                      </div>

                      <div className="ed-field">
                        <label htmlFor="max_allowed_leaves" className="required">Max Allowed Leaves</label>
                        <input
                          id="max_allowed_leaves" name="max_allowed_leaves"
                          type="number" min="0" placeholder="e.g. 2"
                          value={form.max_allowed_leaves} onChange={handleChange}
                          className={errors.max_allowed_leaves ? "is-invalid" : ""}
                        />
                        {errors.max_allowed_leaves && (
                          <p className="error-message">{errors.max_allowed_leaves}</p>
                        )}
                      </div>
                    </div>

                    {/* ── Multi-date inputs ── */}
                    <div className="ahf-dates-section">
                      <div className="ahf-dates-header">
                        <span className="ahf-dates-label required">Festival Dates</span>
                        <button type="button" className="btn btn-secondary ahf-add-date-btn" onClick={addDateRow}>
                          <FaPlus style={{ fontSize: 11 }} />
                          Add Date
                        </button>
                      </div>

                      <div className="ahf-date-rows">
                        {form.dates.map((d, i) => (
                          <div key={i} className="ahf-date-row">
                            <span className="ahf-date-index">{i + 1}</span>
                            <div className="ahf-date-input-wrap">
                              <input
                                type="date" value={d}
                                onChange={(e) => handleDateChange(i, e.target.value)}
                                className={dateFieldError(i) ? "is-invalid" : ""}
                              />
                              {dateFieldError(i) && (
                                <p className="error-message">{dateFieldError(i)}</p>
                              )}
                            </div>
                            <button
                              type="button" className="ahf-remove-btn"
                              onClick={() => removeDateRow(i)}
                              aria-label="Remove date"
                              disabled={form.dates.length === 1}
                            >
                              <FaTrash style={{ fontSize: 13 }} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {validDates.length > 0 && (
                        <div className="ahf-preview">
                          <span className="ahf-preview-label">Preview</span>
                          <div className="ahf-preview-chips">
                            {validDates.map((d) => (
                              <span key={d} className="ahf-chip">
                                {new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
                                  timeZone: TIMEZONE,
                                  day: "2-digit", month: "short", year: "numeric",
                                })}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ── Actions ── */}
                <div className="ed-form-actions">
                  <button type="button" className="btn btn-back" onClick={() => navigate("/attendance/calendar")}>
                    Back
                  </button>
                  <div className="ed-actions-right">
                    <button type="button" className="btn btn-secondary" onClick={handleReset}>
                      Reset
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
                        <><span className="ahf-spinner" />Saving…</>
                      ) : (
                        <><FaPlusCircle style={{ fontSize: 15 }} />{isFestival ? "Add Festival" : "Add Holiday"}</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>

      {/* ── Popup ── */}
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

      <style>{`
        .ed-row          { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .ed-field        { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .ed-field-full   { margin-bottom: 20px; }
        .ed-radio        { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; padding-top: 10px; min-height: 42px; }
        .ed-radio label  { display: flex; align-items: center; gap: 6px; font-weight: 500; cursor: pointer; }
        .ed-form-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; padding-top: 16px; border-top: 1px solid #eee; flex-wrap: wrap; gap: 12px; }
        .ed-actions-right { display: flex; gap: 12px; align-items: center; }

        .ahf-dates-section {
          background: var(--bg-subtle, #f9fafb); border: 1px solid var(--border, #e5e7eb);
          border-radius: var(--radius-sm, 6px); padding: 16px; margin-bottom: 20px;
        }
        .ahf-dates-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .ahf-dates-label  { font-size: 13px; font-weight: 600; color: var(--text, #111); }
        .ahf-add-date-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 13px; }
        .ahf-date-rows    { display: flex; flex-direction: column; gap: 10px; }
        .ahf-date-row     { display: grid; grid-template-columns: 24px 1fr 36px; align-items: start; gap: 10px; }
        .ahf-date-index   { display: flex; align-items: center; justify-content: center; width: 24px; height: 38px; font-size: 12px; font-weight: 700; color: var(--muted, #6b7280); }
        .ahf-date-input-wrap { display: flex; flex-direction: column; gap: 4px; }
        .ahf-date-input-wrap input { width: 100%; box-sizing: border-box; }
        .ahf-remove-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 38px; border-radius: var(--radius-sm, 6px);
          border: 1px solid var(--border-danger, #fca5a5); background: transparent;
          color: var(--danger, #ef4444); cursor: pointer; transition: background 0.15s; flex-shrink: 0;
        }
        .ahf-remove-btn:hover:not(:disabled) { background: #fef2f2; }
        .ahf-remove-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .ahf-preview { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border, #e5e7eb); }
        .ahf-preview-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted, #6b7280); margin-bottom: 8px; }
        .ahf-preview-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .ahf-chip { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; background: var(--primary-light, #dbeafe); color: var(--primary, #2563eb); font-size: 12px; font-weight: 600; }
        .ahf-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: ahfSpin 0.7s linear infinite; }
        @keyframes ahfSpin { to { transform: rotate(360deg); } }

        @media (max-width: 767px) { .ed-row { grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; } }
        @media (max-width: 479px) {
          .ed-form-actions { flex-direction: column; align-items: stretch; }
          .ed-actions-right { flex-direction: column; width: 100%; }
          .ed-actions-right .btn, .ed-form-actions > .btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </>
  );
}