import React, { useState, useEffect, useRef } from "react";
import {
  FaUserClock,
  FaSave,
  FaRedo,
  FaCheckSquare,
  FaSquare,
  FaSearch,
} from "react-icons/fa";
import { useLocation } from "react-router-dom";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

/* ── Searchable Multi-Select Dropdown ── */
const EmployeeMultiSelect = ({ employees, selectedIds, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = employees.filter((emp) => {
    const q = search.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.employee_id?.toString().includes(q) ||
      emp.department?.toLowerCase().includes(q)
    );
  });

  const ITEM_HEIGHT = 46;
  const MAX_VISIBLE = 5;
  const listMaxHeight = `${ITEM_HEIGHT * MAX_VISIBLE}px`;

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((emp) => selectedIds.includes(emp.id));

  const toggleOne = (id) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  };

  const toggleAll = () => {
    const filteredIds = filtered.map((e) => e.id);
    if (allFilteredSelected) {
      onChange(selectedIds.filter((id) => !filteredIds.includes(id)));
    } else {
      onChange([...new Set([...selectedIds, ...filteredIds])]);
    }
  };

  const removeChip = (id, e) => {
    e.stopPropagation();
    onChange(selectedIds.filter((x) => x !== id));
  };

  const selectedEmployees = employees.filter((e) => selectedIds.includes(e.id));

  return (
    <div ref={dropdownRef} style={{ position: "relative", marginBottom: "1rem" }}>
      {/* Trigger box */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "42px",
          padding: "6px 12px",
          border: `1px solid ${error ? "red" : "#ccc"}`,
          borderRadius: "6px",
          cursor: "pointer",
          background: "#fff",
          flexWrap: "wrap",
          gap: "4px",
        }}
      >
        {selectedEmployees.length === 0 ? (
          <span style={{ color: "#aaa", fontSize: "14px" }}>Select employees...</span>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {selectedEmployees.slice(0, 3).map((emp) => (
              <span
                key={emp.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#e8f0fe",
                  color: "#1a56db",
                  fontSize: "12px",
                  padding: "2px 8px",
                  borderRadius: "20px",
                }}
              >
                {emp.name}
                <button
                  type="button"
                  onClick={(e) => removeChip(emp.id, e)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#1a56db",
                    fontSize: "14px",
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
            {selectedEmployees.length > 3 && (
              <span
                style={{
                  background: "#eee",
                  color: "#555",
                  fontSize: "12px",
                  padding: "2px 8px",
                  borderRadius: "20px",
                }}
              >
                +{selectedEmployees.length - 3} more
              </span>
            )}
          </div>
        )}
        <span style={{ marginLeft: "auto", fontSize: "11px", color: "#888" }}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {error && (
        <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{error}</p>
      )}

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              borderBottom: "1px solid #eee",
            }}
          >
            <FaSearch style={{ color: "#aaa", fontSize: "13px" }} />
            <input
              type="text"
              placeholder="Search by name, ID or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "14px",
                background: "transparent",
              }}
            />
          </div>

          {/* Select All */}
          {filtered.length > 0 && (
            <div
              onClick={toggleAll}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 14px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "14px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f7ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {allFilteredSelected ? (
                <FaCheckSquare style={{ color: "#1a56db", fontSize: "15px" }} />
              ) : (
                <FaSquare style={{ color: "#ccc", fontSize: "15px" }} />
              )}
              <span>
                {allFilteredSelected ? "Deselect all" : "Select all"}
                {search && ` (${filtered.length} results)`}
              </span>
            </div>
          )}

          <div style={{ height: "1px", background: "#eee" }} />

          {/* Employee list */}
          <div style={{ maxHeight: listMaxHeight, overflowY: "auto", overflowX: "hidden" }}>
            {filtered.length === 0 ? (
              <p style={{ padding: "16px", color: "#aaa", textAlign: "center", fontSize: "14px" }}>
                No employees found
              </p>
            ) : (
              filtered.map((emp) => {
                const checked = selectedIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleOne(emp.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 14px",
                      cursor: "pointer",
                      fontSize: "14px",
                      height: `${ITEM_HEIGHT}px`,
                      boxSizing: "border-box",
                      background: checked ? "#f0f4ff" : "transparent",
                    }}
                    onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = "#f5f7ff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = checked ? "#f0f4ff" : "transparent"; }}
                  >
                    {checked ? (
                      <FaCheckSquare style={{ color: "#1a56db", fontSize: "15px", flexShrink: 0 }} />
                    ) : (
                      <FaSquare style={{ color: "#ccc", fontSize: "15px", flexShrink: 0 }} />
                    )}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "14px" }}>{emp.name}</span>
                      <span style={{ fontSize: "12px", color: "#888" }}>
                        {emp.employee_id}
                        {emp.department ? ` · ${emp.department}` : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer count */}
          {selectedIds.length > 0 && (
            <div
              style={{
                borderTop: "1px solid #eee",
                padding: "8px 14px",
                fontSize: "12px",
                color: "#555",
                textAlign: "right",
              }}
            >
              {selectedIds.length} employee{selectedIds.length !== 1 ? "s" : ""} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main Page ── */
const AssignShift = () => {
  const formRef = useRef(null);
  const location = useLocation();

  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    shift: "",
    start_date: "",
    employee_ids: [],
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [popup, setPopup] = useState({
    show: false, type: "info", title: "", message: "", onConfirm: null,
  });

  const showPopup = (type, title, message, onConfirm = null) =>
    setPopup({ show: true, type, title, message, onConfirm });
  const closePopup = () =>
    setPopup({ show: false, type: "info", title: "", message: "", onConfirm: null });
  const handleConfirm = () => { popup.onConfirm?.(); closePopup(); };

  const normalizeList = (data, key) => {
    if (Array.isArray(data)) return data;
    if (data?.[key]) return data[key];
    if (data?.results) return data.results;
    return [];
  };

  /* ── Fetch + pre-select from query param ── */
  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      try {
        const [sRes, eRes] = await Promise.all([
          api.get("/api/employees/shifts/"),
          api.get("/api/employees/list/"),
        ]);

        setShifts(normalizeList(sRes.data, "shifts"));

        const empList = normalizeList(eRes.data, "employees").map((e) => ({
          ...e,
          id: e.employee_id,        // ✅ FIX: use employee_id as the select key
          name: e.full_name || e.name,
        }));
        setEmployees(empList);

        // ✅ FIX: query param is now employee_id (passed from EmployeeDetails)
        const params = new URLSearchParams(location.search);
        const preselectedId = params.get("employee");
        if (preselectedId) {
          setFormData((prev) => ({ ...prev, employee_ids: [preselectedId] }));
        }
      } catch (err) {
        console.error(err);
        showPopup("error", "Error", "Failed to load shifts or employees.");
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [location.search]);

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!formData.shift) e.shift = "Please select a shift.";
    if (!formData.start_date) e.start_date = "Please select a start date.";
    if (formData.employee_ids.length === 0) e.employee_ids = "Select at least one employee.";
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
    if (!validate()) {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/employees/employee-shifts/assign_bulk/", {
        shift: Number(formData.shift),
        start_date: formData.start_date,
        employee_ids: formData.employee_ids,  // ✅ these are now employee_id values e.g. "11"
      });
      showPopup(
        "success",
        "Shifts Assigned",
        `Successfully assigned shift to ${formData.employee_ids.length} employee(s).`,
        handleReset,
      );
    } catch (err) {
      console.error(err);
      showPopup("error", "Error", "Failed to assign shift.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ shift: "", start_date: "", employee_ids: [] });
    setErrors({});
    closePopup();
  };

  /* ── Render ── */
  return (
    <>
      <main className="app-main">
        <div className="cf-page-wrapper as-page-wrapper">
          <AutoBreadcrumb />

          <div className="cf-card">
            <section ref={formRef}>
              <div className="cf-form-header">
                <h2 className="cf-form-title">
                  <FaUserClock />
                  Assign Shift to Employees
                </h2>
              </div>

              {loadingData ? (
                <p>Loading...</p>
              ) : (
                <form onSubmit={handleSubmit}>

                  {/* ── SHIFT + START DATE ── */}
                  <div className="cf-row" style={{ marginBottom: "1rem" }}>
                    {/* SHIFT */}
                    <div className="cf-field">
                      <label className="required">Shift</label>
                      <select
                        name="shift"
                        value={formData.shift}
                        onChange={handleChange}
                        style={{
                          width: "100%", padding: "9px 12px", borderRadius: "6px",
                          border: `1px solid ${errors.shift ? "red" : "#ccc"}`,
                          fontSize: "14px", boxSizing: "border-box",
                        }}
                      >
                        <option value="">Select shift</option>
                        {shifts.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {errors.shift && (
                        <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{errors.shift}</p>
                      )}
                    </div>

                    {/* START DATE */}
                    <div className="cf-field">
                      <label className="required">Start Date</label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        style={{
                          width: "100%", padding: "9px 12px", borderRadius: "6px",
                          border: `1px solid ${errors.start_date ? "red" : "#ccc"}`,
                          fontSize: "14px", boxSizing: "border-box",
                        }}
                      />
                      {errors.start_date && (
                        <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{errors.start_date}</p>
                      )}
                    </div>
                  </div>

                  {/* ── EMPLOYEES ── */}
                  <div className="cf-field cf-field--half" style={{ marginBottom: "1rem" }}>
                    <label className="required">Employees</label>
                    <EmployeeMultiSelect
                      employees={employees}
                      selectedIds={formData.employee_ids}
                      onChange={(ids) => {
                        setFormData((prev) => ({ ...prev, employee_ids: ids }));
                        if (errors.employee_ids) setErrors((prev) => ({ ...prev, employee_ids: "" }));
                      }}
                      error={errors.employee_ids}
                    />
                  </div>

                  {/* ACTIONS */}
                  <div className="cf-actions">
                    <button type="submit" className="btn btn-secondary" disabled={submitting}>
                      <FaSave /> {submitting ? "Assigning..." : "Assign Shift"}
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
        .cf-page-wrapper { width: 100%; max-width: 900px; margin-inline: auto; padding: 8px 16px 40px; box-sizing: border-box; }
        .cf-card { width: 100%; background: #fff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.05); padding: 32px; box-sizing: border-box; }
        .cf-form-header { padding-bottom: 14px; border-bottom: 2px solid var(--accent, #ff9800); margin-bottom: 28px; }
        .cf-form-title { font-size: clamp(16px, 3vw, 22px); font-weight: 700; color: var(--primary, #0b91ac); display: flex; align-items: center; gap: 8px; margin: 0; }
        .cf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .cf-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .cf-field input, .cf-field select { width: 100%; box-sizing: border-box; }
        .cf-field--half { width: 50%; }
        .cf-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
        @media (max-width: 767px) {
          .cf-page-wrapper { padding: 6px 10px 32px; }
          .cf-card { padding: 18px; border-radius: 12px; }
          .cf-row { grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; }
          .cf-field--half { width: 100%; }
        }
        @media (max-width: 479px) {
          .cf-card { padding: 14px; border-radius: 10px; }
          .cf-actions { flex-direction: column; }
          .cf-actions .btn { width: 100%; justify-content: center; }
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

export default AssignShift;