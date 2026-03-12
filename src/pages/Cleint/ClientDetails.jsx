import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrashAlt, FaList } from "react-icons/fa";
import Navbar from "../../compomnents/Navbar";
import Sidebar from "../../compomnents/Sidebar";
import Footer from "../../compomnents/Footer";

import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";
// If your CSS is in a separate file, import it here:
// import "./ClientDetails.css";

const ClientDetails = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination & Search state
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Entries-per-page dropdown state
  const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);
  const entriesDropdownRef = useRef(null);

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

  // --------- Fetch Clients ---------
  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/client/list/");
      if (res.data.success) {
        setClients(res.data.clients || []);
        setError("");
      } else {
        setError("Failed to fetch clients.");
      }
    } catch (err) {
      setError("Server error while fetching clients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Close entries dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        entriesDropdownRef.current &&
        !entriesDropdownRef.current.contains(event.target)
      ) {
        setShowEntriesDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --------- Handlers ---------
  const handleEditClient = (clientId) => {
    navigate(`/client/update/${clientId}`);
  };

  const handleDeleteClient = (clientId) => {
    openPopup({
      type: "delete",
      title: "Delete Client",
      message: "Are you sure you want to delete this client?",
      showCancel: true,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        closePopup();
        try {
          const res = await api.delete(`/api/client/delete/${clientId}/`);
          if (res.data.success) {
            await fetchClients();
            openPopup({
              type: "success",
              title: "Deleted",
              message: res.data.message || "Client deleted successfully.",
              confirmText: "OK",
              showCancel: false,
            });
          } else {
            openPopup({
              type: "error",
              title: "Error",
              message: res.data.message || "Failed to delete client.",
              confirmText: "OK",
              showCancel: false,
            });
          }
        } catch (err) {
          openPopup({
            type: "error",
            title: "Error",
            message: err.response?.data?.error || "Server error.",
            confirmText: "OK",
            showCancel: false,
          });
        }
      },
    });
  };

  // --------- Filtering & Pagination ---------
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalEntries = filteredClients.length;
  const totalPages =
    totalEntries === 0 ? 1 : Math.ceil(totalEntries / entriesPerPage);

  const paginatedClients = filteredClients.slice(
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
        <div className="max-w-[1200px] mx-auto px-5 mt-6">
          <AutoBreadcrumb />
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Table Header */}
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
                <FaList className="domain-icon" /> Clients
              </h2>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/client/new")}
              >
                Add Client
              </button>
            </div>

            {/* Top controls */}
            {!loading && !error && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                {/* Left: entries-per-page dropdown */}
                <div className="table-controls-left">
                  <div
                    className="sort-filter-wrapper sort-filter-wrapper-left"
                    ref={entriesDropdownRef}
                  >
                    <button
                      type="button"
                      className="btn btn-sort"
                      onClick={() => setShowEntriesDropdown((prev) => !prev)}
                    >
                      <span>{entriesPerPage} / page</span>
                      <span className="sort-filter-caret" />
                    </button>

                    {showEntriesDropdown && (
                      <div className="sort-filter-dropdown">
                        {[5, 10, 25, 50].map((num) => (
                          <button
                            key={num}
                            type="button"
                            className="sort-filter-option"
                            onClick={() => {
                              setEntriesPerPage(num);
                              setCurrentPage(1);
                              setShowEntriesDropdown(false);
                            }}
                          >
                            <span
                              className={
                                "sort-filter-checkbox" +
                                (entriesPerPage === num ? " checked" : "")
                              }
                            />
                            <span>{num} entries per page</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: search */}
                <div className="table-controls-right">
                  <div className="table-search">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search clients"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            {loading ? (
              <div>Loading clients...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : totalEntries === 0 ? (
              <div>No clients found.</div>
            ) : (
              <>
                <div className="table-responsive">
                  <table id="clientsTable">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Company</th>
                        <th>Contact</th>
                        <th>Email</th>
                        <th>Address</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedClients.map((c) => (
                        <tr key={c.id}>
                          <td>{c.name}</td>
                          <td>{c.company_name}</td>
                          <td>{c.contact}</td>
                          <td>{c.email}</td>
                          <td>{c.address}</td>
                          <td>
                            <div className="actions">
                              <button
                                type="button"
                                className="action-btn edit-btn"
                                title="Edit client"
                                onClick={() => handleEditClient(c.id)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                type="button"
                                className="action-btn delete-btn"
                                title="Delete client"
                                onClick={() => handleDeleteClient(c.id)}
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

                {/* Bottom controls */}
                <div className="table-footer">
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

export default ClientDetails;
