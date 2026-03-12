import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrashAlt, FaHistory, FaList } from "react-icons/fa";
import Navbar from "../../compomnents/Navbar";
import Sidebar from "../../compomnents/Sidebar";
import Footer from "../../compomnents/Footer";

import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";
// If you put the CSS in its own file, e.g. "./DomainDetails.css", import it here:
// import "./DomainDetails.css";

const DomainDetails = () => {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination & Search
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Sort (expiry filter)
  const [sortFilter, setSortFilter] = useState("all"); // "all" = Clear
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortFilterRef = useRef(null);

  // NEW: entries-per-page dropdown
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

  /* ---------------- FETCH DOMAINS ---------------- */
  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/domain/list/");
      if (res.data.success) {
        setDomains(res.data.domains || []);
        setError("");
      } else {
        setError("Failed to fetch domains.");
      }
    } catch (err) {
      setError("Server error while fetching domains.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  // Close sort + entries dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sortFilterRef.current &&
        !sortFilterRef.current.contains(event.target)
      ) {
        setShowSortDropdown(false);
      }

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

  /* ---------------- HANDLERS ---------------- */
  const handleEditDomain = (id) => navigate(`/domain/update/${id}`);

  const handleDeleteDomain = (id) => {
    openPopup({
      type: "delete",
      title: "Delete Domain",
      message: "Are you sure you want to delete this domain?",
      showCancel: true,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        closePopup();
        try {
          await api.delete(`/api/domain/delete/${id}/`);
          await fetchDomains();

          openPopup({
            type: "success",
            title: "Deleted",
            message: "Domain deleted successfully.",
            confirmText: "OK",
            showCancel: false,
          });
        } catch (err) {
          openPopup({
            type: "error",
            title: "Error",
            message: "Server error while deleting domain.",
            confirmText: "OK",
            showCancel: false,
          });
        }
      },
    });
  };

  const handleViewHistory = (id) => {
    navigate(`/domain/history/${id}`);
  };

  const handleViewAllHistory = () => {
    navigate("/domain/history/all");
  };

  const handleSortChange = (value) => {
    setSortFilter(value);
    setCurrentPage(1);
    setShowSortDropdown(false);
  };

  /* ---------------- DATE RENDERING LOGIC ---------------- */
  const renderExpiryContent = (dateStr) => {
    if (!dateStr) return <span className="text-gray-500">N/A</span>;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    if (days < 0) {
      return (
        <span style={{ color: "red", fontWeight: "bold" }}>
          Expired {Math.abs(days)} days ago
        </span>
      );
    }

    if (days <= 7) {
      return <span style={{ color: "red" }}>{formattedDate}</span>;
    }

    if (days <= 30) {
      return <span style={{ color: "orangered" }}>{formattedDate}</span>;
    }

    return (
      <span style={{ color: "black", fontWeight: "bold" }}>
        {formattedDate}
      </span>
    );
  };

  const formatSimpleDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  /* ---------------- SORT FILTER HELPERS ---------------- */
  const getDaysFromToday = (dateStr) => {
    if (!dateStr) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const passesSortFilter = (domain, filter) => {
    const dDomain = getDaysFromToday(domain.expiry_date);
    const dSSH = getDaysFromToday(domain.ssh_expiry_date);
    const dHosting = getDaysFromToday(domain.hosting_expiry_date);

    switch (filter) {
      case "expired":
        return dDomain !== null && dDomain < 0;

      case "domain_week":
        return dDomain !== null && dDomain >= 0 && dDomain <= 7;

      case "ssh_week":
        return dSSH !== null && dSSH >= 0 && dSSH <= 7;

      case "hosting_week":
        return dHosting !== null && dHosting >= 0 && dHosting <= 7;

      case "domain_month":
        return dDomain !== null && dDomain > 7 && dDomain <= 30;

      case "ssh_month":
        return dSSH !== null && dSSH > 7 && dSSH <= 30;

      case "hosting_month":
        return dHosting !== null && dHosting > 7 && dHosting <= 30;

      case "all":
      default:
        return true;
    }
  };

  /* ---------------- FILTERING & PAGINATION ---------------- */
  const filteredDomains = domains.filter((domain) => {
    if (search) {
      const term = search.toLowerCase();
      const matchesSearch =
        domain.domain_name?.toLowerCase().includes(term) ||
        domain.registrar?.toLowerCase().includes(term) ||
        domain.hosting_name?.toLowerCase().includes(term);

      if (!matchesSearch) return false;
    }

    return passesSortFilter(domain, sortFilter);
  });

  const totalEntries = filteredDomains.length;
  const totalPages =
    totalEntries === 0 ? 1 : Math.ceil(totalEntries / entriesPerPage);

  const paginatedDomains = filteredDomains.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage,
  );

  const startEntry =
    totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, totalEntries);

  /* ---------------- RENDER ---------------- */
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
              <div>
                <h2>
                  <FaList className="domain-icon" /> Managed Domains
                </h2>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate("/domain/new")}
                >
                  Add Domain
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleViewAllHistory}
                >
                  <FaHistory style={{ marginRight: 4 }} />
                  History
                </button>
              </div>
            </div>

            {/* Controls */}
            {!loading && !error && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                {/* LEFT: entries-per-page dropdown */}
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

                {/* RIGHT: search + sort dropdown */}
                <div className="table-controls-right">
                  <div className="table-search">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search domains"
                    />
                  </div>

                  {/* Sort button with dropdown */}
                  <div className="sort-filter-wrapper" ref={sortFilterRef}>
                    <button
                      type="button"
                      className="btn btn-sort"
                      onClick={() => setShowSortDropdown((prev) => !prev)}
                    >
                      <span>Sort</span>
                      <span className="sort-filter-caret" />
                    </button>

                    {showSortDropdown && (
                      <div className="sort-filter-dropdown">
                        <button
                          type="button"
                          className="sort-filter-option"
                          onClick={() => handleSortChange("expired")}
                        >
                          <span
                            className={
                              "sort-filter-checkbox" +
                              (sortFilter === "expired" ? " checked" : "")
                            }
                          />
                          <span>Expired</span>
                        </button>

                        <button
                          type="button"
                          className="sort-filter-option"
                          onClick={() => handleSortChange("domain_week")}
                        >
                          <span
                            className={
                              "sort-filter-checkbox" +
                              (sortFilter === "domain_week" ? " checked" : "")
                            }
                          />
                          <span>Domain expiring in week</span>
                        </button>

                        <button
                          type="button"
                          className="sort-filter-option"
                          onClick={() => handleSortChange("ssh_week")}
                        >
                          <span
                            className={
                              "sort-filter-checkbox" +
                              (sortFilter === "ssh_week" ? " checked" : "")
                            }
                          />
                          <span>SSH expiring in week</span>
                        </button>

                        <button
                          type="button"
                          className="sort-filter-option"
                          onClick={() => handleSortChange("hosting_week")}
                        >
                          <span
                            className={
                              "sort-filter-checkbox" +
                              (sortFilter === "hosting_week" ? " checked" : "")
                            }
                          />
                          <span>Hosting expiring in week</span>
                        </button>

                        <button
                          type="button"
                          className="sort-filter-option"
                          onClick={() => handleSortChange("domain_month")}
                        >
                          <span
                            className={
                              "sort-filter-checkbox" +
                              (sortFilter === "domain_month" ? " checked" : "")
                            }
                          />
                          <span>Domain expiring in month</span>
                        </button>

                        <button
                          type="button"
                          className="sort-filter-option"
                          onClick={() => handleSortChange("ssh_month")}
                        >
                          <span
                            className={
                              "sort-filter-checkbox" +
                              (sortFilter === "ssh_month" ? " checked" : "")
                            }
                          />
                          <span>SSH expiring in month</span>
                        </button>

                        <button
                          type="button"
                          className="sort-filter-option"
                          onClick={() => handleSortChange("hosting_month")}
                        >
                          <span
                            className={
                              "sort-filter-checkbox" +
                              (sortFilter === "hosting_month" ? " checked" : "")
                            }
                          />
                          <span>Hosting expiring in month</span>
                        </button>

                        {/* Small line above Clear */}
                        <div className="sort-filter-divider" />

                        {/* Clear at the bottom */}
                        <button
                          type="button"
                          className="sort-filter-option"
                          onClick={() => handleSortChange("all")}
                        >
                          <span
                            className={
                              "sort-filter-checkbox" +
                              (sortFilter === "all" ? " checked" : "")
                            }
                          />
                          <span>Clear</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            {loading ? (
              <div>Loading domains...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : totalEntries === 0 ? (
              <div>No domains found.</div>
            ) : (
              <>
                <div className="table-responsive">
                  <table id="domainsTable">
                    <thead>
                      <tr>
                        <th>Domain</th>
                        <th>Registrar</th>
                        <th>Domain Expiry</th>
                        <th>Status</th>
                        <th>SSH</th>
                        <th>Hosting</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedDomains.map((domain) => {
                        return (
                          <tr key={domain.id}>
                            {/* DOMAIN */}
                            <td>
                              <strong>{domain.domain_name}</strong>
                              <div className="text-sm text-gray-500">
                                Purchased:{" "}
                                {formatSimpleDate(domain.purchase_date)}
                              </div>
                            </td>

                            {/* REGISTRAR */}
                            <td>{domain.registrar || "N/A"}</td>

                            {/* DOMAIN EXPIRY */}
                            <td>{renderExpiryContent(domain.expiry_date)}</td>

                            {/* STATUS */}
                            <td
                              className={
                                domain.active_status
                                  ? "status-active"
                                  : "status-inactive"
                              }
                            >
                              {domain.active_status ? "Active" : "Inactive"}
                            </td>

                            {/* SSH */}
                            <td>
                              {domain.ssh_name ? (
                                <>
                                  <div>{domain.ssh_name}</div>
                                  <div className="text-xs">
                                    Expires:{" "}
                                    {renderExpiryContent(
                                      domain.ssh_expiry_date,
                                    )}
                                  </div>
                                </>
                              ) : (
                                "N/A"
                              )}
                            </td>

                            {/* HOSTING */}
                            <td>
                              {domain.hosting_name ? (
                                <>
                                  <div>{domain.hosting_name}</div>
                                  <div className="text-xs">
                                    Expires:{" "}
                                    {renderExpiryContent(
                                      domain.hosting_expiry_date,
                                    )}
                                  </div>
                                </>
                              ) : (
                                "N/A"
                              )}
                            </td>

                            {/* ACTIONS */}
                            <td>
                              <div className="actions">
                                <button
                                  className="action-btn edit-btn"
                                  onClick={() => handleEditDomain(domain.id)}
                                  title="Edit domain"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="action-btn delete-btn"
                                  onClick={() => handleDeleteDomain(domain.id)}
                                  title="Delete domain"
                                >
                                  <FaTrashAlt />
                                </button>
                                <button
                                  className="action-btn history-btn"
                                  onClick={() => handleViewHistory(domain.id)}
                                  title="View domain history"
                                >
                                  <FaHistory />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
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

export default DomainDetails;
