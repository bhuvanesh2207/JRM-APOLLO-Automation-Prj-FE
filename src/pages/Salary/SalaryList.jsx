import { useEffect, useState } from "react";
import axios from "axios";
import { FaList, FaSearch, FaRedo, FaCalendar, FaUser, FaRupeeSign, FaClock } from "react-icons/fa";

export default function SalaryList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    employee: "",
    month: "",
    year: "",
  });

  const currentYear = new Date().getFullYear();
  const months = [
    { value: "", label: "All Months" },
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

  const fetchSalary = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (filters.employee) params.employee = filters.employee;
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;

      // FIXED: Changed from "/salary/list/" to "/api/salary/list/"
      const res = await axios.get("/api/salary/list/", { params });
      
      setData(res.data.data || []);
      setTotalCount(res.data.count || 0);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Failed to fetch salary records. Please try again."
      );
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalary();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({ employee: "", month: "", year: "" });
    // Fetch after reset
    setTimeout(() => {
      const params = {};
      // FIXED: Changed from "/salary/list/" to "/api/salary/list/"
      axios.get("/api/salary/list/", { params })
        .then(res => {
          setData(res.data.data || []);
          setTotalCount(res.data.count || 0);
        })
        .catch(err => {
          console.error(err);
          setError(err.response?.data?.error || "Failed to fetch salary records.");
        });
    }, 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "₹ 0";
    return `₹ ${parseFloat(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  };

  const getMonthName = (monthNum) => {
    const month = months.find(m => m.value === monthNum);
    return month ? month.label : `Month ${monthNum}`;
  };

  return (
    <>
      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <section className="sl-section">
              <h2 className="sl-heading">
                <FaList className="sl-icon" />
                Salary Records
                {totalCount > 0 && (
                  <span className="sl-count-badge">{totalCount} records</span>
                )}
              </h2>

              {/* Filters Section */}
              <div className="sl-filters-card">
                <h3 className="sl-filters-title">
                  <FaSearch className="sl-filter-icon" />
                  Filter Records
                </h3>
                
                <div className="sl-filters-grid">
                  <div className="sl-filter-field">
                    <label>
                      <FaUser className="sl-label-icon" />
                      Employee ID
                    </label>
                    <input
                      type="number"
                      name="employee"
                      placeholder="Enter employee ID"
                      value={filters.employee}
                      onChange={handleFilterChange}
                    />
                  </div>

                  <div className="sl-filter-field">
                    <label>
                      <FaCalendar className="sl-label-icon" />
                      Month
                    </label>
                    <select
                      name="month"
                      value={filters.month}
                      onChange={handleFilterChange}
                    >
                      {months.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sl-filter-field">
                    <label>
                      <FaCalendar className="sl-label-icon" />
                      Year
                    </label>
                    <input
                      type="number"
                      name="year"
                      placeholder={`e.g. ${currentYear}`}
                      value={filters.year}
                      onChange={handleFilterChange}
                      min="2000"
                      max={currentYear}
                    />
                  </div>
                </div>

                <div className="sl-filter-actions">
                  <button
                    type="button"
                    className="btn btn-back"
                    onClick={handleReset}
                  >
                    <FaRedo /> Reset
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={fetchSalary}
                    disabled={loading}
                  >
                    <FaSearch /> {loading ? "Filtering..." : "Apply Filters"}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="sl-error-box">
                  <p className="sl-error-text">{error}</p>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="sl-loading">
                  <div className="sl-loading-spinner"></div>
                  <p>Loading salary records...</p>
                </div>
              )}

              {/* Table Section */}
              {!loading && (
                <div className="sl-table-section">
                  {data.length > 0 ? (
                    <div className="sl-table-wrapper">
                      <table className="sl-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Employee ID</th>
                            <th>Employee Name</th>
                            <th>Period</th>
                            <th>Base Salary</th>
                            <th>OT Amount</th>
                            <th>Deductions</th>
                            <th>Final Salary</th>
                            <th>Generated At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((item, index) => (
                            <tr key={item.id}>
                              <td className="sl-serial">{index + 1}</td>
                              <td className="sl-employee-id">{item.employee_id}</td>
                              <td className="sl-employee-name">{item.employee}</td>
                              <td className="sl-period">
                                {getMonthName(item.month)} {item.year}
                              </td>
                              <td className="sl-amount">
                                {formatCurrency(item.base_salary)}
                              </td>
                              <td className="sl-amount sl-ot">
                                <FaClock className="sl-inline-icon" />
                                {formatCurrency(item.overtime_amount)}
                              </td>
                              <td className="sl-amount sl-deduction">
                                {formatCurrency(item.total_deduction)}
                              </td>
                              <td className="sl-amount sl-final">
                                <FaRupeeSign className="sl-inline-icon" />
                                {formatCurrency(item.final_salary)}
                              </td>
                              <td className="sl-date">
                                {formatDate(item.generated_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="sl-empty-state">
                      <FaList className="sl-empty-icon" />
                      <h4>No Salary Records Found</h4>
                      <p>
                        {Object.values(filters).some(v => v)
                          ? "No records match your filter criteria. Try adjusting your filters."
                          : "Generate salary records to see them here."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <style>{`
        .sl-section { width: 100%; }
        
        .sl-heading {
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
        
        .sl-icon { color: var(--primary, #0b91ac); font-size: 22px; }
        
        .sl-count-badge {
          font-size: 13px;
          font-weight: 500;
          background: #e5e7eb;
          color: #4b5563;
          padding: 4px 10px;
          border-radius: 20px;
          margin-left: 8px;
        }
        
        /* Filters Card */
        .sl-filters-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 24px;
        }
        
        .sl-filters-title {
          font-size: 15px;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .sl-filter-icon {
          color: var(--primary, #0b91ac);
          font-size: 14px;
        }
        
        .sl-filters-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .sl-filter-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .sl-filter-field label {
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .sl-label-icon {
          color: #9ca3af;
          font-size: 12px;
        }
        
        .sl-filter-field input,
        .sl-filter-field select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #fff;
        }
        
        .sl-filter-field input:focus,
        .sl-filter-field select:focus {
          outline: none;
          border-color: var(--primary, #0b91ac);
          box-shadow: 0 0 0 3px rgba(11, 145, 172, 0.1);
        }
        
        .sl-filter-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
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
          background: #fff;
          color: #4b5563;
          border: 1px solid #d1d5db;
        }
        
        .btn-back:hover:not(:disabled) {
          background: #f9fafb;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Error Box */
        .sl-error-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 20px;
        }
        
        .sl-error-text {
          margin: 0;
          color: #dc2626;
          font-size: 14px;
        }
        
        /* Loading State */
        .sl-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          color: #6b7280;
        }
        
        .sl-loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: var(--primary, #0b91ac);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Table Styles */
        .sl-table-section {
          margin-top: 8px;
        }
        
        .sl-table-wrapper {
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
        }
        
        .sl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          min-width: 1200px;
        }
        
        .sl-table th {
          background: #f9fafb;
          padding: 14px 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }
        
        .sl-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #e5e7eb;
          color: #4b5563;
        }
        
        .sl-table tbody tr:hover {
          background: #f9fafb;
        }
        
        .sl-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .sl-serial {
          color: #9ca3af;
          font-weight: 500;
          width: 50px;
        }
        
        .sl-employee-id {
          font-family: monospace;
          font-weight: 500;
          color: var(--primary, #0b91ac);
        }
        
        .sl-employee-name {
          font-weight: 500;
        }
        
        .sl-period {
          white-space: nowrap;
        }
        
        .sl-amount {
          font-family: monospace;
          text-align: right;
          white-space: nowrap;
        }
        
        .sl-ot {
          color: #059669;
        }
        
        .sl-deduction {
          color: #dc2626;
        }
        
        .sl-final {
          font-weight: 700;
          color: #1e293b;
        }
        
        .sl-date {
          color: #6b7280;
          font-size: 13px;
          white-space: nowrap;
        }
        
        .sl-inline-icon {
          font-size: 10px;
          margin-right: 4px;
          opacity: 0.7;
        }
        
        /* Empty State */
        .sl-empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #f9fafb;
          border-radius: 10px;
          border: 1px dashed #d1d5db;
        }
        
        .sl-empty-icon {
          font-size: 48px;
          color: #d1d5db;
          margin-bottom: 16px;
        }
        
        .sl-empty-state h4 {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
        }
        
        .sl-empty-state p {
          color: #6b7280;
          margin: 0;
          max-width: 400px;
          margin: 0 auto;
        }
        
        /* Responsive */
        @media (max-width: 767px) {
          .sl-filters-grid { grid-template-columns: 1fr; gap: 16px; }
          .sl-filter-actions { flex-direction: column; }
          .sl-filter-actions .btn { width: 100%; }
          .sl-table-wrapper { font-size: 13px; }
        }
        
        @media (max-width: 479px) {
          .sl-heading { font-size: 15px; }
          .sl-count-badge { margin-left: 0; margin-top: 4px; }
        }
      `}</style>
    </>
  );
}