import { useState } from "react";
import axios from "axios";
import { FaCoins, FaSpinner } from "react-icons/fa";

export default function SalaryGenerate() {
  const [formData, setFormData] = useState({
    employee_id: "",
    month: "",
    year: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setResult(null);
  };

  const handleGenerate = async () => {
    // Validation
    if (!formData.month || !formData.year) {
      setError("Month and Year are required");
      return;
    }

    const monthNum = parseInt(formData.month);
    const yearNum = parseInt(formData.year);

    if (monthNum < 1 || monthNum > 12) {
      setError("Month must be between 1 and 12");
      return;
    }

    if (yearNum < 2000 || yearNum > currentYear + 1) {
      setError(`Year must be between 2000 and ${currentYear + 1}`);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const payload = {
        month: monthNum,
        year: yearNum,
      };

      if (formData.employee_id) {
        payload.employee_id = parseInt(formData.employee_id);
      }

      // FIXED: Changed from "/salary/generate/" to "/api/salary/generate/"
      const res = await axios.post("/api/salary/generate/", payload);

      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Error generating salary. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ employee_id: "", month: "", year: "" });
    setResult(null);
    setError("");
  };

  return (
    <>
      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <section className="sg-section">
              <h2 className="sg-heading">
                <FaCoins className="sg-icon" />
                Generate Salary
                <span className="sg-badge">Admin Only</span>
              </h2>

              <div className="sg-info-box">
                <p className="sg-info-text">
                  Generate salary for a specific employee or all active employees for the selected month and year.
                </p>
              </div>

              <form onSubmit={(e) => e.preventDefault()} noValidate>
                <div className="sg-row">
                  <div className="sg-field">
                    <label>
                      Employee ID <span className="sg-optional">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      name="employee_id"
                      placeholder="Leave empty to generate for all active employees"
                      value={formData.employee_id}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <p className="sg-hint">
                      If provided, salary will be generated only for this employee
                    </p>
                  </div>
                </div>

                <div className="sg-row">
                  <div className="sg-field">
                    <label className="required">Month</label>
                    <select
                      name="month"
                      value={formData.month}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    >
                      <option value="">-- Select Month --</option>
                      {months.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sg-field">
                    <label className="required">Year</label>
                    <input
                      type="number"
                      name="year"
                      placeholder={`e.g. ${currentYear}`}
                      value={formData.year}
                      onChange={handleChange}
                      disabled={loading}
                      min="2000"
                      max={currentYear + 1}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="sg-error-box">
                    <p className="sg-error-text">{error}</p>
                  </div>
                )}

                <div className="sg-form-actions">
                  <button
                    type="button"
                    className="btn btn-back"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="sg-spinner" /> Generating...
                      </>
                    ) : (
                      "Generate Salary"
                    )}
                  </button>
                </div>
              </form>

              {result && (
                <div className="sg-result-section">
                  <h3 className="sg-result-heading">
                    Generation Result
                    <span className="sg-result-badge">{result.count} processed</span>
                  </h3>

                  <div className="sg-success-message">
                    <p>✓ {result.message}</p>
                  </div>

                  {result.data && result.data.length > 0 && (
                    <div className="sg-result-table-wrapper">
                      <table className="sg-result-table">
                        <thead>
                          <tr>
                            <th>Employee ID</th>
                            <th>Employee Name</th>
                            <th>Final Salary (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.data.map((item, index) => (
                            <tr key={index}>
                              <td>{item.employee_id}</td>
                              <td>{item.employee}</td>
                              <td className="sg-salary-amount">
                                ₹ {item.final_salary?.toLocaleString() || "0"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <style>{`
        .sg-section { width: 100%; }
        
        .sg-heading {
          font-size: clamp(16px, 3vw, 20px);
          font-weight: 700;
          color: var(--primary, #0b91ac);
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--accent, #ff9800);
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .sg-icon { color: var(--primary, #0b91ac); font-size: 22px; }
        
        .sg-badge {
          font-size: 12px;
          font-weight: 500;
          background: #fef3c7;
          color: #d97706;
          padding: 4px 10px;
          border-radius: 20px;
          margin-left: 8px;
        }
        
        .sg-info-box {
          background: #f0f9ff;
          border-left: 4px solid var(--primary, #0b91ac);
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 24px;
        }
        
        .sg-info-text {
          margin: 0;
          color: #555;
          font-size: 14px;
        }
        
        .sg-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .sg-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }
        
        .sg-field label {
          font-size: 13px;
          font-weight: 600;
          color: #444;
        }
        
        .sg-field label.required::after {
          content: " *";
          color: #e53935;
        }
        
        .sg-field input,
        .sg-field select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #fff;
        }
        
        .sg-field input:focus,
        .sg-field select:focus {
          outline: none;
          border-color: var(--primary, #0b91ac);
          box-shadow: 0 0 0 3px rgba(11, 145, 172, 0.1);
        }
        
        .sg-field input:disabled,
        .sg-field select:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }
        
        .sg-optional {
          font-size: 12px;
          color: #888;
          font-weight: 400;
          margin-left: 4px;
        }
        
        .sg-hint {
          font-size: 12px;
          color: #6b7280;
          margin: 4px 0 0 0;
        }
        
        .sg-error-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 20px;
        }
        
        .sg-error-text {
          margin: 0;
          color: #dc2626;
          font-size: 14px;
        }
        
        .sg-form-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }
        
        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }
        
        .btn-primary {
          background: var(--primary, #0b91ac);
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #0a7f96;
        }
        
        .btn-back {
          background: #f3f4f6;
          color: #4b5563;
        }
        
        .btn-back:hover:not(:disabled) {
          background: #e5e7eb;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .sg-spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .sg-result-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        
        .sg-result-heading {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .sg-result-badge {
          font-size: 12px;
          font-weight: 500;
          background: #e5e7eb;
          color: #4b5563;
          padding: 4px 10px;
          border-radius: 20px;
        }
        
        .sg-success-message {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 20px;
        }
        
        .sg-success-message p {
          margin: 0;
          color: #16a34a;
          font-weight: 500;
        }
        
        .sg-result-table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .sg-result-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        .sg-result-table th {
          background: #f9fafb;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .sg-result-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          color: #4b5563;
        }
        
        .sg-result-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .sg-result-table tbody tr:hover {
          background: #f9fafb;
        }
        
        .sg-salary-amount {
          font-weight: 600;
          color: #059669;
        }
        
        @media (max-width: 767px) {
          .sg-row { grid-template-columns: 1fr; gap: 16px; }
          .sg-form-actions { flex-direction: column; }
          .sg-form-actions .btn { width: 100%; }
        }
        
        @media (max-width: 479px) {
          .sg-heading { font-size: 15px; }
          .sg-badge { margin-left: 0; margin-top: 4px; }
        }
      `}</style>
    </>
  );
}