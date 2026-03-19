// DomainDetails.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrashAlt, FaHistory, FaList } from "react-icons/fa";

import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const DomainDetails = () => {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntries] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortFilter, setSortFilter] = useState("all");
  const [showSortDrop, setShowSortDrop] = useState(false);
  const [showEntDrop, setShowEntDrop] = useState(false);
  const sortRef = useRef(null);
  const entRef = useRef(null);

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
  const openPopup = (cfg) =>
    setPopupConfig({
      show: true,
      type: "info",
      title: "",
      message: "",
      confirmText: "OK",
      cancelText: "Cancel",
      showCancel: false,
      onConfirm: null,
      ...cfg,
    });
  const closePopup = () => setPopupConfig((p) => ({ ...p, show: false }));

  /* ── fetch ── */
  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/domain/list/");
      if (res.data.success) {
        setDomains(res.data.domains || []);
        setError("");
      } else setError("Failed to fetch domains.");
    } catch {
      setError("Server error while fetching domains.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDomains();
  }, []);

  /* ── close dropdowns on outside click ── */
  useEffect(() => {
    const h = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target))
        setShowSortDrop(false);
      if (entRef.current && !entRef.current.contains(e.target))
        setShowEntDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── delete handler ── */
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
          });
        } catch {
          openPopup({
            type: "error",
            title: "Error",
            message: "Server error while deleting domain.",
            confirmText: "OK",
          });
        }
      },
    });
  };

  /* ── date helpers ── */
  const getDays = (d) => {
    if (!d) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(d);
    exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp - today) / 86400000);
  };

  const renderExpiry = (dateStr) => {
    if (!dateStr) return <span className="text-gray">N/A</span>;
    const days = getDays(dateStr);
    const fmt = new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    if (days < 0)
      return (
        <span className="expiry-expired">Expired {Math.abs(days)}d ago</span>
      );
    if (days <= 7) return <span className="expiry-critical">{fmt}</span>;
    if (days <= 30) return <span className="expiry-warning">{fmt}</span>;
    return <span className="expiry-ok">{fmt}</span>;
  };

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  /* ── sort filter ── */
  const passesSortFilter = (domain, f) => {
    const dD = getDays(domain.expiry_date);
    const dS = getDays(domain.ssh_expiry_date);
    const dH = getDays(domain.hosting_expiry_date);
    switch (f) {
      case "expired":
        return dD !== null && dD < 0;
      case "domain_week":
        return dD !== null && dD >= 0 && dD <= 7;
      case "ssh_week":
        return dS !== null && dS >= 0 && dS <= 7;
      case "hosting_week":
        return dH !== null && dH >= 0 && dH <= 7;
      case "domain_month":
        return dD !== null && dD > 7 && dD <= 30;
      case "ssh_month":
        return dS !== null && dS > 7 && dS <= 30;
      case "hosting_month":
        return dH !== null && dH > 7 && dH <= 30;
      default:
        return true;
    }
  };

  /* ── pagination ── */
  const filtered = domains.filter((d) => {
    if (search) {
      const t = search.toLowerCase();
      if (
        !d.domain_name?.toLowerCase().includes(t) &&
        !d.registrar?.toLowerCase().includes(t) &&
        !d.hosting_name?.toLowerCase().includes(t)
      )
        return false;
    }
    return passesSortFilter(d, sortFilter);
  });

  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const paginated = filtered.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage,
  );
  const startEntry =
    totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, totalEntries);

  const SORT_OPTIONS = [
    { value: "expired", label: "Expired" },
    { value: "domain_week", label: "Domain expiring in week" },
    { value: "ssh_week", label: "SSH expiring in week" },
    { value: "hosting_week", label: "Hosting expiring in week" },
    { value: "domain_month", label: "Domain expiring in month" },
    { value: "ssh_month", label: "SSH expiring in month" },
    { value: "hosting_month", label: "Hosting expiring in month" },
  ];

  /* ── render ── */
  return (
    <main className="app-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AutoBreadcrumb />
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="table-header">
            <h2>
              <FaList className="domain-icon" /> Managed Domains
            </h2>
            <div className="flex flex-wrap gap-2">
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
                onClick={() => navigate("/domain/history/all")}
              >
                <FaHistory style={{ marginRight: 4 }} /> History
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
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div className="table-controls-left">
                <div
                  className="sort-filter-wrapper sort-filter-wrapper-left"
                  ref={entRef}
                >
                  <button
                    type="button"
                    className="btn btn-sort"
                    onClick={() => setShowEntDrop((v) => !v)}
                  >
                    <span>{entriesPerPage} / page</span>
                    <span className="sort-filter-caret" />
                  </button>
                  {showEntDrop && (
                    <div className="sort-filter-dropdown">
                      {[5, 10, 25, 50].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="sort-filter-option"
                          onClick={() => {
                            setEntries(n);
                            setCurrentPage(1);
                            setShowEntDrop(false);
                          }}
                        >
                          <span
                            className={`sort-filter-checkbox${entriesPerPage === n ? " checked" : ""}`}
                          />
                          <span>{n} entries per page</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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
                    aria-label="Search domains"
                  />
                </div>
                <div className="sort-filter-wrapper" ref={sortRef}>
                  <button
                    type="button"
                    className="btn btn-sort"
                    onClick={() => setShowSortDrop((v) => !v)}
                  >
                    <span>Sort</span>
                    <span className="sort-filter-caret" />
                  </button>
                  {showSortDrop && (
                    <div className="sort-filter-dropdown">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className="sort-filter-option"
                          onClick={() => {
                            setSortFilter(opt.value);
                            setCurrentPage(1);
                            setShowSortDrop(false);
                          }}
                        >
                          <span
                            className={`sort-filter-checkbox${sortFilter === opt.value ? " checked" : ""}`}
                          />
                          <span>{opt.label}</span>
                        </button>
                      ))}
                      <div className="sort-filter-divider" />
                      <button
                        type="button"
                        className="sort-filter-option"
                        onClick={() => {
                          setSortFilter("all");
                          setCurrentPage(1);
                          setShowSortDrop(false);
                        }}
                      >
                        <span
                          className={`sort-filter-checkbox${sortFilter === "all" ? " checked" : ""}`}
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
            <div className="no-data">Loading domains...</div>
          ) : error ? (
            <div style={{ color: "var(--error)" }}>{error}</div>
          ) : totalEntries === 0 ? (
            <div className="no-data">No domains found.</div>
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
                    {paginated.map((domain) => (
                      <tr key={domain.id}>
                        <td data-label="Domain">
                          <div>
                            <strong>{domain.domain_name}</strong>
                            <div className="text-sm text-gray">
                              Purchased: {fmtDate(domain.purchase_date)}
                            </div>
                          </div>
                        </td>
                        <td data-label="Registrar">
                          {domain.registrar || "N/A"}
                        </td>
                        <td data-label="Expiry">
                          {renderExpiry(domain.expiry_date)}
                        </td>
                        <td
                          data-label="Status"
                          className={
                            domain.active_status
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {domain.active_status ? "Active" : "Inactive"}
                        </td>
                        <td data-label="SSH">
                          {domain.ssh_name ? (
                            <div>
                              <div>{domain.ssh_name}</div>
                              <div className="text-xs">
                                Expires: {renderExpiry(domain.ssh_expiry_date)}
                              </div>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td data-label="Hosting">
                          {domain.hosting_name ? (
                            <div>
                              <div>{domain.hosting_name}</div>
                              <div className="text-xs">
                                Expires:{" "}
                                {renderExpiry(domain.hosting_expiry_date)}
                              </div>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td data-label="Actions">
                          <div className="actions">
                            <button
                              className="action-btn edit-btn"
                              onClick={() =>
                                navigate(`/domain/update/${domain.id}`)
                              }
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteDomain(domain.id)}
                              title="Delete"
                            >
                              <FaTrashAlt />
                            </button>
                            <button
                              className="action-btn history-btn"
                              onClick={() =>
                                navigate(`/domain/history/${domain.id}`)
                              }
                              title="History"
                            >
                              <FaHistory />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pg) => (
                      <button
                        key={pg}
                        className={`pagination-btn${currentPage === pg ? " active" : ""}`}
                        onClick={() => setCurrentPage(pg)}
                      >
                        {pg}
                      </button>
                    ),
                  )}
                  <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Popup
        show={popupConfig.show}
        type={popupConfig.type}
        title={popupConfig.title}
        message={popupConfig.message}
        onClose={closePopup}
        onConfirm={popupConfig.onConfirm ? popupConfig.onConfirm : closePopup}
        confirmText={popupConfig.confirmText}
        cancelText={popupConfig.cancelText}
        showCancel={popupConfig.showCancel}
      />
    </main>
  );
};

export default DomainDetails;
