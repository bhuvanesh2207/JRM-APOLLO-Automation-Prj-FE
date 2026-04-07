import React, { useState, useEffect } from "react";
import { FaListAlt, FaClock, FaEdit, FaPlus, FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

/* ── Helpers ── */
const fmt12 = (t) => {
  if (!t) return "—";
  const [hRaw, m] = t.split(":");
  const h = parseInt(hRaw, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

const ShiftList = () => {
  const navigate = useNavigate();
  const [shifts, setShifts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup]     = useState({
    show: false, type: "info", title: "", message: "", onConfirm: null,
  });

  const showPopup  = (type, title, message, onConfirm = null) =>
    setPopup({ show: true, type, title, message, onConfirm });
  const closePopup = () =>
    setPopup({ show: false, type: "info", title: "", message: "", onConfirm: null });
  const handleConfirm = () => { popup.onConfirm?.(); closePopup(); };

  /* ── Fetch shifts ── */
  useEffect(() => { fetchShifts(); }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/employees/shifts/");
      setShifts(res.data);
    } catch {
      showPopup("error", "Error", "Failed to load shifts.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Delete shift ── */
  const handleDelete = (shift) => {
    showPopup(
      "delete",
      "Delete Shift",
      `Are you sure you want to delete "${shift.name}"? This cannot be undone.`,
      async () => {
        try {
          await api.delete(`/api/employees/shifts/${shift.id}/`);
          await fetchShifts();
          showPopup("success", "Deleted", `Shift "${shift.name}" deleted successfully.`);
        } catch {
          showPopup("error", "Error", "Failed to delete shift. It may be assigned to employees.");
        }
      }
    );
  };

  return (
    <>
      <main className="app-main">
        <div className="sl-page-wrapper">
          <AutoBreadcrumb />

          <div className="cf-card">

            {/* Header */}
            <div className="cf-form-header sl-header-row">
              <h2 className="cf-form-title">
                <FaListAlt className="domain-icon" />
                All Shifts
              </h2>
              <button
                className="btn btn-secondary sl-add-btn"
                onClick={() => navigate("/shifts/new")}
              >
                <FaPlus /> Add Shift
              </button>
            </div>

            {/* Loading skeleton */}
            {loading ? (
              <div className="sl-skeleton-wrap">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="sl-skeleton-row" />
                ))}
              </div>
            ) : shifts.length === 0 ? (
              <div className="sl-empty">
                <FaClock className="sl-empty-icon" />
                <p>No shifts found. <button className="sl-link" onClick={() => navigate("/shifts/new")}>Create one</button></p>
              </div>
            ) : (
              /* ── Table ── */
              <div className="sl-table-wrap">
                <table className="sl-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Shift Name</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Working Hours</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((shift, idx) => (
                      <tr key={shift.id}>
                        <td className="sl-idx">{idx + 1}</td>
                        <td className="sl-name">{shift.name}</td>
                        <td>
                          <span className="sl-time-badge sl-time-start">
                            <FaClock className="sl-badge-icon" />
                            {fmt12(shift.start_time)}
                          </span>
                        </td>
                        <td>
                          <span className="sl-time-badge sl-time-end">
                            <FaClock className="sl-badge-icon" />
                            {fmt12(shift.end_time)}
                          </span>
                        </td>
                        <td>
                          <span className="sl-hours-badge">
                            {shift.working_hours} hrs
                          </span>
                        </td>
                        <td>
                          <div className="sl-actions">
                            <button
                              className="sl-action-btn sl-edit-btn"
                              title="Edit shift"
                              onClick={() => navigate(`/shifts/edit/${shift.id}`)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="sl-action-btn sl-delete-btn"
                              title="Delete shift"
                              onClick={() => handleDelete(shift)}
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </main>

      <style>{`
        .sl-page-wrapper {
          width: 100%;
          max-width: 1000px;
          margin-inline: auto;
          padding: 8px 16px 40px;
          box-sizing: border-box;
        }

        .cf-card {
          width: 100%;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.05);
          padding: 32px;
          box-sizing: border-box;
        }
        .cf-form-header {
          padding-bottom: 14px;
          border-bottom: 2px solid var(--accent, #ff9800);
          margin-bottom: 28px;
        }
        .cf-form-title {
          font-size: clamp(16px, 3vw, 22px);
          font-weight: 700;
          color: var(--primary, #0b91ac);
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }

        .sl-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .sl-add-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          padding: 8px 16px;
        }

        /* ── Table ── */
        .sl-table-wrap {
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid #e9ecef;
        }
        .sl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .sl-table thead tr {
          background: var(--primary, #0b91ac);
          color: #fff;
        }
        .sl-table thead th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }
        .sl-table tbody tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.15s;
        }
        .sl-table tbody tr:last-child { border-bottom: none; }
        .sl-table tbody tr:hover { background: #f8fafc; }
        .sl-table tbody td {
          padding: 12px 16px;
          color: #374151;
          vertical-align: middle;
        }

        .sl-idx  { color: #9ca3af; font-weight: 600; width: 48px; }
        .sl-name { font-weight: 600; color: #111827; }

        /* Time badges */
        .sl-time-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12.5px;
          font-weight: 500;
          white-space: nowrap;
        }
        .sl-time-start {
          background: #e0f7f9;
          color: #0b91ac;
          border: 1px solid #b2ebf2;
        }
        .sl-time-end {
          background: #fff3e0;
          color: #e65100;
          border: 1px solid #ffe0b2;
        }
        .sl-badge-icon { font-size: 10px; }

        /* Hours badge */
        .sl-hours-badge {
          display: inline-block;
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 12.5px;
          font-weight: 600;
        }

        /* Action buttons */
        .sl-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sl-action-btn {
          background: none;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 8px;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .sl-edit-btn {
          color: var(--primary, #0b91ac);
        }
        .sl-edit-btn:hover {
          background: var(--primary, #0b91ac);
          color: #fff;
          border-color: var(--primary, #0b91ac);
        }
        .sl-delete-btn {
          color: #ef4444;
          border-color: #fecaca;
        }
        .sl-delete-btn:hover {
          background: #ef4444;
          color: #fff;
          border-color: #ef4444;
        }

        /* Empty state */
        .sl-empty {
          text-align: center;
          padding: 48px 20px;
          color: #9ca3af;
        }
        .sl-empty-icon {
          font-size: 40px;
          margin-bottom: 12px;
          opacity: 0.4;
        }
        .sl-empty p { font-size: 14px; }
        .sl-link {
          background: none;
          border: none;
          color: var(--primary, #0b91ac);
          cursor: pointer;
          font-weight: 600;
          text-decoration: underline;
          padding: 0;
        }

        /* Skeleton loader */
        .sl-skeleton-wrap { padding: 8px 0; }
        .sl-skeleton-row {
          height: 48px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: sl-shimmer 1.4s infinite;
          border-radius: 8px;
          margin-bottom: 10px;
        }
        @keyframes sl-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 767px) {
          .sl-page-wrapper { padding: 6px 10px 32px; }
          .cf-card { padding: 18px; border-radius: 12px; }
          .sl-table thead th,
          .sl-table tbody td { padding: 10px 12px; }
        }
        @media (max-width: 479px) {
          .cf-card { padding: 14px; }
          .sl-header-row { flex-direction: column; align-items: flex-start; }
          .sl-add-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <Popup
        show={popup.show} type={popup.type} title={popup.title} message={popup.message}
        onClose={closePopup} onConfirm={handleConfirm}
        confirmText="OK" cancelText="Cancel"
        showCancel={popup.type === "delete"}
      />
    </>
  );
};

export default ShiftList;