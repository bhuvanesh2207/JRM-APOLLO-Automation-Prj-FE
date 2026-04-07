import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import JSZip from "jszip";
import {
  FaArrowLeft,
  FaPrint,
  FaDownload,
  FaFileAlt,
  FaUser,
  FaAmbulance,
  FaUniversity,
  FaFileArchive,
} from "react-icons/fa";
import AutoBreadcrumb from "../../compomnents/AutoBreadcrumb";
import api from "../../api/axios";

const TIMEZONE = import.meta.env.VITE_TIMEZONE;

/* ── Helpers ── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        timeZone: TIMEZONE,
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const designationLabel = (val) => {
  const map = {
    software_developer: "Software Developer",
    graphic_designer:   "Graphic Designer",
    web_designer:       "Web Designer",
    ui_ux_designer:     "UI/UX Designer",
    business_analyst:   "Business Analyst",
  };
  return map[val] || val || "—";
};

const v = (val) => val || "—";

// Convert raw Django media URL → secure API URL
const toSecureUrl = (url) =>
  url?.replace(/^(https?:\/\/[^/]+)\/media\//, "$1/api/employees/media/");

/* ── InfoCell ── */
const InfoCell = ({ label, children, wide, noPrint }) => (
  <div className={`ev-cell${wide ? " ev-cell--wide" : ""}${noPrint ? " no-print" : ""}`}>
    <span className="ev-cell-label">{label}</span>
    <span className="ev-cell-value">{children || "—"}</span>
  </div>
);

/* ── Section ── */
const Section = ({ icon, title, children }) => (
  <div className="ev-section">
    <div className="ev-section-head">
      <span className="ev-section-icon">{icon}</span>
      <span className="ev-section-title">{title}</span>
    </div>
    <div className="ev-section-body">{children}</div>
  </div>
);

/* ── Document card ── */
const DocCard = ({ label, url }) => {
  if (!url) return null;
  const filename = url.split("/").pop().split("?")[0];
  const short = filename.length > 30 ? filename.slice(0, 27) + "..." : filename;

  // Open via secure API route so JWT cookie is sent
  const handleOpen = () =>
    window.open(toSecureUrl(url), "_blank", "noopener,noreferrer");

  return (
    <div className="ev-doc-card">
      <div className="ev-doc-icon"><FaFileAlt /></div>
      <div className="ev-doc-meta">
        <span className="ev-doc-label">{label}</span>
        <span className="ev-doc-filename" title={filename}>{short}</span>
      </div>
      <button className="ev-doc-download" onClick={handleOpen}>
        <FaDownload style={{ marginRight: 6 }} /> Download
      </button>
    </div>
  );
};

/* ── ZIP download ── */
const downloadAllAsZip = async (emp) => {
  const docs = [
    { url: emp.aadhaar_card, name: "Aadhaar_Card" },
    { url: emp.pan,          name: "PAN_Card"      },
    { url: emp.photo,        name: "Photo"          },
  ].filter((d) => d.url);

  if (!docs.length) return alert("No documents to download.");

  // ✅ Use the imported JSZip directly — no window.JSZip or script injection needed
  const zip = new JSZip();
  const folder = zip.folder(`${emp.full_name}_Documents`);

  await Promise.all(
    docs.map(async ({ url, name }) => {
      try {
        // Fetch via secure API route with JWT cookie
        const res = await fetch(toSecureUrl(url), { credentials: "include" });
        const blob = await res.blob();
        const ext = url.split(".").pop().split("?")[0] || "bin";
        folder.file(`${name}.${ext}`, blob);
      } catch {
        console.warn("Failed to fetch:", url);
      }
    })
  );

  const content = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(content);
  a.download = `${emp.full_name}_Documents.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
const EmployeesView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);

  const [emp, setEmp]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const res = await api.get(`/api/employees/${id}/`);
        if (res.data.success) setEmp(res.data.employee);
        else setError("Employee not found.");
      } catch {
        setError("Server error loading employee details.");
      } finally {
        setLoading(false);
      }
    };
    loadEmployee();
  }, [id]);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML || "";
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Employee Details — ${emp?.full_name || ""}</title>
          <style>
            *{box-sizing:border-box;margin:0;padding:0}
            body{font-family:'Segoe UI',sans-serif;color:#222;background:#fff;padding:32px}
            .print-header{text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #ff9800}
            .print-header h1{font-size:22px;color:#0b91ac;margin-bottom:8px}
            .print-badges{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
            .badge-id{padding:4px 14px;border-radius:20px;background:#0b91ac;color:#fff;font-size:12px;font-weight:600}
            .badge-desig{padding:4px 14px;border-radius:20px;background:#fff3e0;color:#e65100;font-size:12px;font-weight:600}
            .ev-section{margin-bottom:20px}
            .ev-section-head{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:2px solid #0b91ac;font-weight:700;color:#0b91ac;font-size:14px;margin-bottom:8px}
            .ev-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}
            .ev-cell{padding:9px 12px}
            .ev-cell--wide{grid-column:span 2}
            .ev-cell-label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#999;margin-bottom:3px;font-weight:600}
            .ev-cell-value{font-size:13px;color:#222;font-weight:500}
            .ev-status-active{color:#16a34a;font-weight:700}
            .ev-status-inactive{color:#dc2626;font-weight:700}
            .ev-blood-badge{display:inline-block;padding:2px 10px;border-radius:12px;background:#fee2e2;color:#dc2626;font-size:12px;font-weight:700}
            .no-print{display:none!important}
            .print-footer{text-align:center;margin-top:28px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:12px}
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Employee Details</h1>
            <div class="print-badges">
              <span class="badge-id">ID: ${emp?.employee_id}</span>
              <span class="badge-desig">${designationLabel(emp?.designation)}</span>
            </div>
          </div>
          ${content}
          <div class="print-footer">
            Printed on: ${new Date().toLocaleString("en-IN", { timeZone: TIMEZONE })} &nbsp;·&nbsp; © ${new Date().getFullYear()} Your Company. All rights reserved.
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  if (loading) {
    return (
      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="no-data">Loading employee details…</div>
        </div>
      </main>
    );
  }

  if (error || !emp) {
    return (
      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div style={{ color: "var(--error, #e53935)" }}>{error || "Employee not found."}</div>
        </div>
      </main>
    );
  }

  const hasDocuments = emp.aadhaar_card || emp.pan || emp.photo;

  return (
    <main className="app-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AutoBreadcrumb />

        <div className="bg-white rounded-lg shadow-lg p-6">

          {/* ── Top action bar ── */}
          <div className="ev-topbar no-print">
            <button className="ev-btn-back" onClick={() => navigate("/employees/all")}>
              <FaArrowLeft style={{ marginRight: 6 }} /> Back to List
            </button>
            <button className="ev-btn-print" onClick={handlePrint}>
              <FaPrint style={{ marginRight: 6 }} /> Print This Page
            </button>
          </div>

          {/* ── Printable content ── */}
          <div ref={printRef}>

            <Section icon={<FaUser />} title="Personal / Employee Information">
              <div className="ev-grid">
                <InfoCell label="Full Name">{v(emp.full_name)}</InfoCell>
                <InfoCell label="Employee ID">{v(emp.employee_id)}</InfoCell>
                <InfoCell label="Designation">{designationLabel(emp.designation)}</InfoCell>
                <InfoCell label="Status">
                  <span className={emp.status === "active" ? "ev-status-active" : "ev-status-inactive"}>
                    {emp.status === "active" ? "Active" : "Inactive"}
                  </span>
                </InfoCell>
                <InfoCell label="Date of Birth">{fmtDate(emp.dob)}</InfoCell>
                <InfoCell label="Date of Joining">{fmtDate(emp.date_of_joining)}</InfoCell>
                <InfoCell label="Email">{v(emp.email)}</InfoCell>
                <InfoCell label="Salary">
                  {emp.salary ? `₹ ${Number(emp.salary).toLocaleString("en-IN")}` : "—"}
                </InfoCell>
                <InfoCell label="Primary Contact">{v(emp.primary_contact_no)}</InfoCell>
                <InfoCell label="Alternate Contact" noPrint>{v(emp.alt_contact_no)}</InfoCell>
                <InfoCell label="Current Address" wide>{v(emp.current_address)}</InfoCell>
                <InfoCell label="Permanent Address" wide noPrint>{v(emp.permanent_address)}</InfoCell>
              </div>
            </Section>

            <Section icon={<FaAmbulance />} title="Emergency & Medical">
              <div className="ev-grid">
                <InfoCell label="Blood Group">
                  {emp.blood_group
                    ? <span className="ev-blood-badge">{emp.blood_group}</span>
                    : "—"}
                </InfoCell>
                <InfoCell label="Emergency Contact Person">{v(emp.emergency_contact_person)}</InfoCell>
                <InfoCell label="Emergency Contact No.">{v(emp.emergency_contact_no)}</InfoCell>
                <InfoCell label="Relationship">{v(emp.emergency_relationship)}</InfoCell>
                <InfoCell label="Medical Conditions" wide noPrint>{v(emp.medical_conditions)}</InfoCell>
              </div>
            </Section>

            <Section icon={<FaUniversity />} title="Bank / Account Details">
              <div className="ev-grid">
                <InfoCell label="Bank Name">{v(emp.bank_name)}</InfoCell>
                <InfoCell label="Account Holder Name">{v(emp.account_holder_name)}</InfoCell>
                <InfoCell label="Account Number">{v(emp.account_number)}</InfoCell>
                <InfoCell label="IFSC Code">{v(emp.ifsc_code)}</InfoCell>
                <InfoCell label="Branch">{v(emp.bank_branch)}</InfoCell>
                <InfoCell label="Account Type">
                  {emp.account_type
                    ? emp.account_type.charAt(0).toUpperCase() + emp.account_type.slice(1)
                    : "—"}
                </InfoCell>
              </div>
            </Section>

            {hasDocuments && (
              <div className="no-print">
                <Section icon={<FaFileAlt />} title="Documents">
                  <div className="ev-docs-actions">
                    <button className="ev-btn-zip" onClick={() => downloadAllAsZip(emp)}>
                      <FaFileArchive style={{ marginRight: 6 }} /> Download All as ZIP
                    </button>
                  </div>
                  <div className="ev-docs-grid">
                    {emp.aadhaar_card && <DocCard label="Aadhaar Card"      url={emp.aadhaar_card} />}
                    {emp.pan          && <DocCard label="PAN Card"           url={emp.pan}          />}
                    {emp.photo        && <DocCard label="Professional Photo" url={emp.photo}        />}
                  </div>
                </Section>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        .ev-topbar {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
        }
        .ev-btn-back {
          display: flex; align-items: center;
          padding: 8px 16px; border-radius: 7px; cursor: pointer;
          border: 1px solid #d0d0d0; background: #f5f5f5; color: #444;
          font-size: 13px; font-weight: 600; transition: all .15s;
        }
        .ev-btn-back:hover { background: #e8e8e8; border-color: #bbb; }
        .ev-btn-print {
          display: flex; align-items: center;
          padding: 8px 18px; border-radius: 7px; cursor: pointer;
          border: none; background: #0b91ac; color: #fff;
          font-size: 13px; font-weight: 600; transition: background .15s;
        }
        .ev-btn-print:hover { background: #0980a0; }
        .ev-section { margin-bottom: 24px; }
        .ev-section-head {
          display: flex; align-items: center; gap: 8px;
          padding: 0 0 8px 0; border-bottom: 2px solid #0b91ac;
          font-weight: 700; color: #0b91ac; font-size: 14px; margin-bottom: 4px;
        }
        .ev-section-icon { font-size: 14px; }
        .ev-section-body { padding: 0; }
        .ev-grid { display: grid; grid-template-columns: 1fr 1fr; }
        .ev-cell { padding: 10px 12px; }
        .ev-cell--wide { grid-column: span 2; }
        .ev-cell-label {
          display: block; font-size: 10px; text-transform: uppercase;
          letter-spacing: .5px; color: #999; margin-bottom: 4px; font-weight: 600;
        }
        .ev-cell-value { font-size: 13.5px; color: #222; font-weight: 500; }
        .ev-status-active   { font-size: 13px; font-weight: 700; color: #16a34a; }
        .ev-status-inactive { font-size: 13px; font-weight: 700; color: #dc2626; }
        .ev-blood-badge {
          display: inline-block; padding: 2px 10px; border-radius: 12px;
          background: #fee2e2; color: #dc2626; font-size: 12px; font-weight: 700;
        }
        .ev-docs-actions { display: flex; justify-content: flex-end; padding: 8px 0 4px; }
        .ev-btn-zip {
          display: flex; align-items: center;
          padding: 8px 18px; border-radius: 7px; border: none; cursor: pointer;
          background: #22c55e; color: #fff; font-size: 13px; font-weight: 600; transition: background .15s;
        }
        .ev-btn-zip:hover { background: #16a34a; }
        .ev-docs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 14px; padding: 10px 0 4px;
        }
        .ev-doc-card {
          display: flex; flex-direction: column; gap: 12px;
          padding: 16px; border-radius: 8px;
          border: 1px solid #e0e0e0; background: #fafafa; transition: box-shadow .15s;
        }
        .ev-doc-card:hover { box-shadow: 0 4px 14px rgba(11,145,172,.13); }
        .ev-doc-icon { font-size: 28px; color: #0b91ac; }
        .ev-doc-meta { display: flex; flex-direction: column; gap: 3px; }
        .ev-doc-label    { font-size: 13px; font-weight: 700; color: #333; }
        .ev-doc-filename { font-size: 11px; color: #888; word-break: break-all; }
        .ev-doc-download {
          display: flex; align-items: center; justify-content: center;
          width: 100%; padding: 8px 0; border-radius: 6px; border: none; cursor: pointer;
          background: #0b91ac; color: #fff; font-size: 13px; font-weight: 600; transition: background .15s;
        }
        .ev-doc-download:hover { background: #0980a0; }
        @media (max-width: 600px) {
          .ev-grid { grid-template-columns: 1fr; }
          .ev-cell--wide { grid-column: span 1; }
          .ev-docs-grid { grid-template-columns: 1fr; }
          .ev-topbar { flex-direction: column; }
          .ev-btn-back, .ev-btn-print { width: 100%; justify-content: center; }
        }
        @media print { .no-print { display: none !important; } }
      `}</style>
    </main>
  );
};

export default EmployeesView;