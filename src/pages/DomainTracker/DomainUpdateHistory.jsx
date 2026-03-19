import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaHistory } from "react-icons/fa";
import Navbar from "../../compomnents/Navbar";
import Sidebar from "../../compomnents/Sidebar";
import Footer from "../../compomnents/Footer";

import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const DomainHistory = () => {
  const { domainId } = useParams();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Popup state
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

  const openPopup = (config) => {
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
  };

  const closePopup = () => {
    setPopupConfig((prev) => ({ ...prev, show: false }));
  };

  // Filters
  const [searchDomain, setSearchDomain] = useState("");
  const [searchDate, setSearchDate] = useState("");

  // Pagination
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch history
  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const url = domainId
        ? `/api/domain/history/${domainId}/`
        : `/api/domain/history/`;
      const res = await api.get(url);
      if (res.data.success) {
        setHistory(res.data.history || []);
      } else {
        const msg = res.data.message || "Failed to fetch history.";
        setError(msg);
        openPopup({
          type: "error",
          title: "Error",
          message: msg,
          confirmText: "OK",
          showCancel: false,
        });
      }
    } catch (err) {
      const msg = "Server error while fetching history.";
      setError(msg);
      openPopup({
        type: "error",
        title: "Error",
        message: msg,
        confirmText: "OK",
        showCancel: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [domainId]);

  // Filtered history
  const filteredHistory = history.filter((item) => {
    const domainMatch = searchDomain
      ? item.domain?.domain_name
          ?.toLowerCase()
          .includes(searchDomain.toLowerCase())
      : true;
    const dateMatch = searchDate
      ? item.updated_at?.slice(0, 5) === searchDate
      : true;
    return domainMatch && dateMatch;
  });

  // Pagination
  const totalEntries = filteredHistory.length;
  const totalPages =
    totalEntries === 0 ? 1 : Math.ceil(totalEntries / entriesPerPage);

  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage,
  );
  const startEntry =
    totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, totalEntries);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AutoBreadcrumb />
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Header */}
            <div
              className="table-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2>
                <FaHistory className="domain-icon" /> Domain History
              </h2>
            </div>

            {/* Top controls: entries + filters on right */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ marginRight: 8 }}
                >
                  {[5, 10, 50, 100].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                entries per page
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    htmlFor="searchDomain"
                    style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}
                  >
                    Search by Domain Name
                  </label>
                  <input
                    type="text"
                    id="searchDomain"
                    placeholder="e.g. example.com"
                    value={searchDomain}
                    onChange={(e) => {
                      setSearchDomain(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ padding: "0.4rem 0.6rem", minWidth: "220px" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    htmlFor="searchDate"
                    style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}
                  >
                    Filter by Updated Date
                  </label>
                  <input
                    type="date"
                    id="searchDate"
                    value={searchDate}
                    onChange={(e) => {
                      setSearchDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ padding: "0.3rem 0.6rem" }}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div>Loading history...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : totalEntries === 0 ? (
              <div>No history records found.</div>
            ) : (
              <>
                <div className="table-responsive">
                  <table id="domainHistoryTable">
                    <thead>
                      <tr>
                        <th>Domain Name</th>
                        <th>Registrar</th>
                        <th>Updated</th>
                        <th>What Was Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHistory.map((record) => {
                        const updatedDisplay = record.updated_at
                          ? new Date(record.updated_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "N/A";

                        return (
                          <tr key={record.id}>
                            <td>{record.domain?.domain_name || "N/A"}</td>
                            <td>
                              {record.domain?.registrar || "Not specified"}
                            </td>
                            <td>{updatedDisplay}</td>
                            <td>{record.changes}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bottom pagination */}
                <div className="table-footer" style={{ marginTop: "12px" }}>
                  <div className="entries-info">
                    {`Showing ${startEntry} to ${endEntry} of ${totalEntries} entries`}
                  </div>
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          className={`pagination-btn${
                            currentPage === page ? " active" : ""
                          }`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      ),
                    )}
                    <button
                      className="pagination-btn"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Global popup component */}
      <Popup
        show={popupConfig.show}
        type={popupConfig.type}
        title={popupConfig.title}
        message={popupConfig.message}
        onClose={closePopup}
        onConfirm={
          popupConfig.onConfirm ? () => popupConfig.onConfirm() : closePopup
        }
        confirmText={popupConfig.confirmText}
        cancelText={popupConfig.cancelText}
        showCancel={popupConfig.showCancel}
      />
      <Footer />
    </div>
  );
};

export default DomainHistory;
