import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrashAlt, FaList } from "react-icons/fa";

import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import Popup from "../../compomnents/Popup";
import api from "../../api/axios";

const ClientDetails = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);
  const entriesDropdownRef = useRef(null);

  const [popupConfig, setPopupConfig] = useState({
    show: false, type: "info", title: "", message: "",
    confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null,
  });
  const openPopup = (cfg) =>
    setPopupConfig({ show: true, type: "info", title: "", message: "",
      confirmText: "OK", cancelText: "Cancel", showCancel: false, onConfirm: null, ...cfg });
  const closePopup = () => setPopupConfig((p) => ({ ...p, show: false }));

  /* ── Fetch ── */
  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/client/list/");
      if (res.data.success) { setClients(res.data.clients || []); setError(""); }
      else setError("Failed to fetch clients.");
    } catch { setError("Server error while fetching clients."); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchClients(); }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const h = (e) => {
      if (entriesDropdownRef.current && !entriesDropdownRef.current.contains(e.target))
        setShowEntriesDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Delete ── */
  const handleDeleteClient = (clientId) => {
    openPopup({
      type: "delete", title: "Delete Client",
      message: "Are you sure you want to delete this client?",
      showCancel: true, confirmText: "Delete", cancelText: "Cancel",
      onConfirm: async () => {
        closePopup();
        try {
          const res = await api.delete(`/api/client/delete/${clientId}/`);
          if (res.data.success) {
            await fetchClients();
            openPopup({ type: "success", title: "Deleted",
              message: res.data.message || "Client deleted successfully.", confirmText: "OK" });
          } else {
            openPopup({ type: "error", title: "Error",
              message: res.data.message || "Failed to delete client.", confirmText: "OK" });
          }
        } catch (err) {
          openPopup({ type: "error", title: "Error",
            message: err.response?.data?.error || "Server error.", confirmText: "OK" });
        }
      },
    });
  };

  /* ── Pagination ── */
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalEntries = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedClients = filteredClients.slice(
    (safePage - 1) * entriesPerPage, safePage * entriesPerPage
  );
  const startEntry = totalEntries === 0 ? 0 : (safePage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(safePage * entriesPerPage, totalEntries);

  return (
    <>
      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AutoBreadcrumb />

          <div className="bg-white rounded-lg shadow-lg p-6">

            {/* ── Header
                .table-header uses justify-content: space-between in the global CSS,
                so h2 sits on the left and the button is pushed to the right end.
            ── */}
            <div className="table-header">
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

            {/* ── Controls ── */}
            {!loading && !error && (
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>

                <div className="table-controls-left">
                  <div className="sort-filter-wrapper sort-filter-wrapper-left"
                    ref={entriesDropdownRef}>
                    <button type="button" className="btn btn-sort"
                      onClick={() => setShowEntriesDropdown((v) => !v)}>
                      <span>{entriesPerPage} / page</span>
                      <span className="sort-filter-caret" />
                    </button>
                    {showEntriesDropdown && (
                      <div className="sort-filter-dropdown">
                        {[5, 10, 25, 50].map((n) => (
                          <button key={n} type="button" className="sort-filter-option"
                            onClick={() => { setEntriesPerPage(n); setCurrentPage(1); setShowEntriesDropdown(false); }}>
                            <span className={`sort-filter-checkbox${entriesPerPage === n ? " checked" : ""}`} />
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
                      onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                      placeholder="Search clients"
                      aria-label="Search clients"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── States ── */}
            {loading ? (
              <div className="no-data">Loading clients...</div>
            ) : error ? (
              <div style={{ color: "var(--error)" }}>{error}</div>
            ) : totalEntries === 0 ? (
              <div className="no-data">No clients found.</div>
            ) : (
              <>
                {/* table-responsive + id="clientsTable" → CSS section 25 applies
                    horizontal-scroll override on mobile (same as #domainsTable) */}
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
                          <td data-label="Name">{c.name}</td>
                          <td data-label="Company">{c.company_name}</td>
                          <td data-label="Contact">{c.contact}</td>
                          <td data-label="Email">{c.email}</td>
                          <td data-label="Address">{c.address}</td>
                          <td data-label="Actions">
                            <div className="actions">
                              <button type="button" className="action-btn edit-btn"
                                title="Edit client"
                                onClick={() => navigate(`/client/update/${c.id}`)}>
                                <FaEdit />
                              </button>
                              <button type="button" className="action-btn delete-btn"
                                title="Delete client"
                                onClick={() => handleDeleteClient(c.id)}>
                                <FaTrashAlt />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Footer ── */}
                <div className="table-footer">
                  <div className="entries-info">
                    {`Showing ${startEntry} to ${endEntry} of ${totalEntries} entries`}
                  </div>
                  <div className="pagination">
                    <button className="pagination-btn"
                      disabled={safePage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button key={pg}
                        className={`pagination-btn${safePage === pg ? " active" : ""}`}
                        onClick={() => setCurrentPage(pg)}>
                        {pg}
                      </button>
                    ))}
                    <button className="pagination-btn"
                      disabled={safePage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

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
    </>
  );
};

export default ClientDetails;