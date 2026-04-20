import { useState, useEffect, useRef, useCallback } from "react";

/* ─── FONT AWESOME ───────────────────────────────────────────────────────── */
if (!document.getElementById("fa-cdn")) {
  const link = document.createElement("link");
  link.id = "fa-cdn"; link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
  document.head.appendChild(link);
}

/* ─── API ─────────────────────────────────────────────────────────────────── */
const BASE = "/api/attendance/employee-permissions";
const apiFetch = (url, opts = {}) =>
  fetch(url, { credentials: "include", ...opts }).then((r) => r.json());

const api = {
  getActive : ()         => apiFetch(`${BASE}/active/`),
  getList   : (qs = "")  => apiFetch(`${BASE}/?${qs}`),
  request   : (body)     => apiFetch(`${BASE}/request/`,        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  review    : (id, body) => apiFetch(`${BASE}/${id}/review/`,   { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  start     : (id)       => apiFetch(`${BASE}/${id}/start/`,    { method: "POST" }),
  complete  : (id, form) => apiFetch(`${BASE}/${id}/complete/`, { method: "POST", body: form }),
  cancel    : (id)       => apiFetch(`${BASE}/${id}/cancel/`,   { method: "DELETE" }),
};

/* ─── FORMAT HELPERS ─────────────────────────────────────────────────────── */
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtFull = (iso) => iso ? new Date(iso).toLocaleString("en-IN",     { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const todayISO = () => new Date().toISOString().slice(0, 10);

/* ─── ELAPSED TIMER ──────────────────────────────────────────────────────── */
function useElapsed(startIso) {
  const [txt, setTxt] = useState("00:00:00");
  useEffect(() => {
    if (!startIso) return;
    const tick = () => {
      const s = Math.max(0, Math.floor((Date.now() - new Date(startIso)) / 1000));
      setTxt([Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":"));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startIso]);
  return txt;
}

/* ─── GPS HOOK ───────────────────────────────────────────────────────────── */
function useGPS() {
  const [coords,  setCoords]  = useState(null);
  const [gpsErr,  setGpsErr]  = useState(null);
  const [loading, setLoading] = useState(false);
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) { setGpsErr("Geolocation not supported."); return; }
    setLoading(true); setGpsErr(null);
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lon: p.coords.longitude, acc: Math.round(p.coords.accuracy) }); setLoading(false); },
      () => { setGpsErr("Location access denied. Please enable GPS."); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);
  return { coords, setCoords, gpsErr, loading, getLocation };
}

/* ─── CAMERA COMPONENT ───────────────────────────────────────────────────── */
function CameraCapture({ onCapture }) {
  const videoRef = useRef(null), canvasRef = useRef(null), streamRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [preview,   setPreview]   = useState(null);
  const [camErr,    setCamErr]    = useState(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null; setStreaming(false);
  }, []);

  useEffect(() => {
    if (streaming && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [streaming]);

  const start = useCallback(async () => {
    setCamErr(null);
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setStreaming(true);
    } catch { setCamErr("Camera access denied."); }
  }, []);

  const capture = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((blob) => {
      if (!blob || blob.size === 0) { setCamErr("Failed to capture. Try again."); return; }
      const file = new File([blob], "return_photo.jpg", { type: "image/jpeg" });
      setPreview(URL.createObjectURL(blob)); stop(); onCapture(file);
    }, "image/jpeg", 0.92);
  }, [stop, onCapture]);

  const retake = useCallback(() => {
    setPreview((p) => { if (p) URL.revokeObjectURL(p); return null; });
    onCapture(null); start();
  }, [start, onCapture]);

  useEffect(() => () => { stop(); setPreview((p) => { if (p) URL.revokeObjectURL(p); return null; }); }, [stop]);

  return (
    <div>
      <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#f0f0f0", border: "2px dashed #d0d0d0", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        {preview ? <img src={preview} alt="Captured" style={{ width: "100%", height: 200, objectFit: "cover" }} />
          : streaming ? <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: 200, objectFit: "cover" }} />
          : <div style={{ textAlign: "center", color: "#aaa", padding: 20 }}><i className="fa-solid fa-camera" style={{ fontSize: 36, display: "block", marginBottom: 8 }} /><div style={{ fontSize: 13 }}>Camera not started</div></div>}
        {preview && <div style={{ position: "absolute", top: 8, right: 8, background: "#16a34a", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}><i className="fa-solid fa-check" style={{ marginRight: 4 }} />Captured</div>}
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {camErr && <p style={S.errText}>{camErr}</p>}
      {!preview
        ? !streaming
          ? <button style={S.btnOutline} onClick={start}><i className="fa-solid fa-camera" style={{ marginRight: 6 }} />Open Camera</button>
          : <button style={S.btnPrimary} onClick={capture}><i className="fa-solid fa-circle-dot" style={{ marginRight: 6 }} />Take Photo</button>
        : <button style={S.btnOutline} onClick={retake}><i className="fa-solid fa-rotate-left" style={{ marginRight: 6 }} />Retake</button>}
    </div>
  );
}

/* ─── BADGE ──────────────────────────────────────────────────────────────── */
function Badge({ value }) {
  const map = {
    ACTIVE    : { bg: "#e6f7ea", color: "#16a34a", dot: "#16a34a" },
    COMPLETED : { bg: "#e0f2fe", color: "#0b91ac", dot: "#0b91ac" },
    REJECTED  : { bg: "#fee2e2", color: "#dc2626", dot: "#dc2626" },
    PENDING   : { bg: "#fff3e0", color: "#d97706", dot: "#f59e0b" },
    APPROVED  : { bg: "#ecfdf5", color: "#059669", dot: "#10b981" },
    OK        : { bg: "#e6f7ea", color: "#16a34a", dot: "#16a34a" },
    OVERUSED  : { bg: "#fff3e0", color: "#e65100", dot: "#ff9800" },
    MID_DAY   : { bg: "#fff8e1", color: "#b45309", dot: "#f59e0b" },
    END_DAY   : { bg: "#ede9fe", color: "#6d28d9", dot: "#8b5cf6" },
    EMERGENCY : { bg: "#fee2e2", color: "#dc2626", dot: "#dc2626" },
    PREPLANNED: { bg: "#e0f2fe", color: "#0b91ac", dot: "#0b91ac" },
  };
  const labels = {
    ACTIVE: "Active", COMPLETED: "Completed", REJECTED: "Rejected",
    PENDING: "Pending", APPROVED: "Approved",
    OK: "OK", OVERUSED: "Overused", MID_DAY: "Mid Day", END_DAY: "End of Day",
    EMERGENCY: "Emergency", PREPLANNED: "Pre-planned",
  };
  const s = map[value] || { bg: "#f0f0f0", color: "#666", dot: "#aaa" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", background: s.bg, color: s.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {labels[value] || value}
    </span>
  );
}

/* ─── UI PRIMITIVES ──────────────────────────────────────────────────────── */
function InfoRow({ label, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#222", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{children || "—"}</span>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: "2px solid #0b91ac", marginBottom: 4 }}>
          {icon && <i className={icon} style={{ fontSize: 14, color: "#0b91ac" }} />}
          <span style={{ fontWeight: 700, color: "#0b91ac", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</span>
        </div>
      )}
      <div style={{ padding: "4px 0" }}>{children}</div>
    </div>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────────── */
const S = {
  label     : { display: "block", fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 },
  input     : { width: "100%", border: "1px solid #d0d0d0", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fafafa", color: "#222", boxSizing: "border-box" },
  textarea  : { width: "100%", border: "1px solid #d0d0d0", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fafafa", color: "#222", resize: "vertical", minHeight: 80, boxSizing: "border-box" },
  btnPrimary: { width: "100%", padding: "12px", borderRadius: 8, border: "none", cursor: "pointer", background: "#0b91ac", color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "inherit" },
  btnGreen  : { width: "100%", padding: "12px", borderRadius: 8, border: "none", cursor: "pointer", background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "inherit" },
  btnOrange : { width: "100%", padding: "12px", borderRadius: 8, border: "none", cursor: "pointer", background: "#ff9800", color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "inherit" },
  btnDanger : { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #fca5a5", cursor: "pointer", background: "#fff5f5", color: "#dc2626", fontWeight: 700, fontSize: 14, fontFamily: "inherit" },
  btnOutline: { width: "100%", padding: "11px", borderRadius: 8, border: "1px solid #d0d0d0", cursor: "pointer", background: "#fff", color: "#444", fontWeight: 600, fontSize: 13, fontFamily: "inherit" },
  btnSm     : (c = "#0b91ac") => ({ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: c, color: "#fff", fontWeight: 600, fontSize: 12, fontFamily: "inherit" }),
  errBox    : { background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 12 },
  errText   : { color: "#dc2626", fontSize: 12, marginTop: 4, marginBottom: 8 },
  successBox: { background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", color: "#16a34a", fontSize: 13, marginBottom: 12 },
  timerBlock: { background: "linear-gradient(135deg, #0b91ac, #0778a0)", borderRadius: 12, padding: "20px", textAlign: "center", marginBottom: 14, color: "#fff" },
  timerNum  : { fontSize: 40, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: -2, lineHeight: 1, margin: "6px 0" },
  timerSub  : { fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" },
  gpsBox    : { display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#16a34a", marginBottom: 8 },
  spinner   : { display: "inline-block", width: 14, height: 14, border: "2px solid #ccc", borderTop: "2px solid #0b91ac", borderRadius: "50%", animation: "spin 0.7s linear infinite", marginRight: 6, verticalAlign: "middle" },
  filterSel : { border: "1px solid #d0d0d0", borderRadius: 7, padding: "7px 10px", fontSize: 12, fontFamily: "inherit", outline: "none", background: "#fafafa", color: "#444" },
  th        : { textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "#aaa", padding: "10px 14px", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" },
  td        : { padding: "11px 14px", fontSize: 13, color: "#444", borderBottom: "1px solid #f9f9f9", verticalAlign: "middle" },
  tab       : (active) => ({
    padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
    fontWeight: 700, fontSize: 13,
    background: active ? "#0b91ac" : "#f0f0f0",
    color: active ? "#fff" : "#666",
    transition: "all 0.15s",
  }),
};

/* ══════════════════════════════════════════════════════════════
   SCREEN — REQUEST FORM  (Emergency + Preplanned tabs)
══════════════════════════════════════════════════════════════ */
function RequestForm({ onSuccess }) {
  const [tab,         setTab]         = useState("EMERGENCY");   // EMERGENCY | PREPLANNED
  const [expectedEnd, setExpectedEnd] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [reason,      setReason]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  const minDT   = new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16);
  const minDate = todayISO();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!expectedEnd || reason.trim().length < 5) { setError("Please fill all fields correctly."); return; }
    if (tab === "PREPLANNED" && !plannedDate) { setError("Please select the planned date."); return; }

    setLoading(true);
    try {
      const body = {
        request_type     : tab,
        expected_end_time: new Date(expectedEnd).toISOString(),
        reason           : reason.trim(),
      };
      if (tab === "PREPLANNED") body.planned_date = plannedDate;

      const data = await api.request(body);
      if (data.success) {
        onSuccess(data.permission);
      } else {
        setError(data.errors ? Object.values(data.errors).flat().join(" ") : data.message || "Submission failed.");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <main className="app-main">
      <div className="cf-page-wrapper">
        <div className="cf-card">

          <div className="cf-form-header">
            <h2 className="cf-form-title">
              <i className="fa-solid fa-file-circle-plus domain-icon" />
              Request Permission
            </h2>
          </div>

          {/* ── Tab switcher ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <button style={S.tab(tab === "EMERGENCY")}  onClick={() => setTab("EMERGENCY")}>
              <i className="fa-solid fa-bolt" style={{ marginRight: 6 }} />Emergency
            </button>
            <button style={S.tab(tab === "PREPLANNED")} onClick={() => setTab("PREPLANNED")}>
              <i className="fa-solid fa-calendar-check" style={{ marginRight: 6 }} />Pre-planned
            </button>
          </div>

          {/* ── Info banner per tab ── */}
          {tab === "EMERGENCY" ? (
            <div style={{ background: "#fff3e0", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#92400e" }}>
              <i className="fa-solid fa-bolt" style={{ marginRight: 8, color: "#f59e0b" }} />
              <strong>Emergency permission</strong> — Takes effect immediately. Admin will be notified.
            </div>
          ) : (
            <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#075985" }}>
              <i className="fa-solid fa-calendar-check" style={{ marginRight: 8, color: "#0b91ac" }} />
              <strong>Pre-planned permission</strong> — Admin will approve or reject before the date. You'll be notified by email.
            </div>
          )}

          <form onSubmit={submit} noValidate>
            {error && (
              <div style={S.errBox}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />{error}
              </div>
            )}

            {/* Planned date — only for preplanned */}
            {tab === "PREPLANNED" && (
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Planned Date *</label>
                <input
                  type="date"
                  value={plannedDate}
                  min={minDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  style={{ ...S.input, colorScheme: "light" }}
                  required
                />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Expected Return Time *</label>
              <input
                type="datetime-local"
                value={expectedEnd}
                min={minDT}
                onChange={(e) => setExpectedEnd(e.target.value)}
                style={{ ...S.input, colorScheme: "light" }}
                required
              />
            </div>

            <div style={{ marginBottom: 4 }}>
              <label style={S.label}>Reason *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe why you need to step out… (min 5 characters)"
                style={S.textarea}
                minLength={5}
                maxLength={1000}
                required
              />
              <div style={{ textAlign: "right", fontSize: 11, color: "#bbb", marginTop: 3 }}>{reason.length}/1000</div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button type="submit" style={tab === "PREPLANNED" ? S.btnPrimary : S.btnOrange} disabled={loading}>
                {loading
                  ? <><span style={S.spinner} />Submitting…</>
                  : tab === "PREPLANNED"
                    ? <><i className="fa-solid fa-paper-plane" style={{ marginRight: 8 }} />Send for Approval</>
                    : <><i className="fa-solid fa-bolt" style={{ marginRight: 8 }} />Submit Emergency Request</>}
              </button>
            </div>
          </form>

          {/* ── History table (employee's own list) ── */}
          <EmployeePermissionHistory />

        </div>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════
   EMPLOYEE PERMISSION HISTORY TABLE (inside request page)
══════════════════════════════════════════════════════════════ */
function EmployeePermissionHistory() {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getList().then((d) => setList(d.permissions || [])).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ marginTop: 32, textAlign: "center", color: "#aaa", padding: 20 }}>
      <span style={S.spinner} /> Loading history…
    </div>
  );

  if (list.length === 0) return null;

  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: "2px solid #0b91ac", marginBottom: 12 }}>
        <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: 14, color: "#0b91ac" }} />
        <span style={{ fontWeight: 700, color: "#0b91ac", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>Permission History</span>
      </div>
      <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #f0f0f0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#fafafa" }}>
            <tr>
              {["Date", "Type", "Request", "Expected Return", "Status", "Remarks"].map((h) => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fbff")} onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                <td style={S.td}>{fmtDate(p.date)}</td>
                <td style={S.td}><Badge value={p.permission_type} /></td>
                <td style={S.td}><Badge value={p.request_type} /></td>
                <td style={S.td}>{fmtFull(p.expected_end_time)}</td>
                <td style={S.td}><Badge value={p.status} /></td>
                <td style={S.td}>{p.admin_remarks || <span style={{ color: "#ddd" }}>—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCREEN — PENDING (waiting for admin approval)
══════════════════════════════════════════════════════════════ */
function PendingScreen({ permission, onCancel }) {
  const [cancelling, setCancelling] = useState(false);
  const [error,      setError]      = useState(null);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this permission request?")) return;
    setCancelling(true);
    try {
      const data = await api.cancel(permission.id);
      if (data.success) onCancel();
      else setError(data.message || "Failed to cancel.");
    } catch { setError("Network error."); }
    finally { setCancelling(false); }
  };

  return (
    <main className="app-main">
      <div className="cf-page-wrapper">
        <div className="cf-card">
          <div className="cf-form-header">
            <h2 className="cf-form-title">
              <i className="fa-solid fa-hourglass-half domain-icon" />
              Awaiting Admin Approval
            </h2>
          </div>

          {/* Waiting banner */}
          <div style={{ background: "#fff3e0", border: "1px solid #fed7aa", borderRadius: 12, padding: "20px", textAlign: "center", marginBottom: 24 }}>
            <i className="fa-solid fa-hourglass-half" style={{ fontSize: 32, color: "#f59e0b", marginBottom: 10, display: "block" }} />
            <div style={{ fontWeight: 700, color: "#d97706", fontSize: 15, marginBottom: 6 }}>Request Submitted</div>
            <div style={{ fontSize: 13, color: "#b45309" }}>
              Your pre-planned permission is waiting for admin approval.<br />
              You'll be notified by email once a decision is made.
            </div>
          </div>

          <Section title="Request Details" icon="fa-solid fa-circle-info">
            <InfoRow label="Status"><Badge value="PENDING" /></InfoRow>
            <InfoRow label="Request Type"><Badge value={permission.request_type} /></InfoRow>
            <InfoRow label="Permission Type"><Badge value={permission.permission_type} /></InfoRow>
            <InfoRow label="Planned Date">{fmtDate(permission.date)}</InfoRow>
            <InfoRow label="Expected Return">{fmtFull(permission.expected_end_time)}</InfoRow>
            <InfoRow label="Reason">{permission.reason}</InfoRow>
          </Section>

          {error && <div style={S.errBox}><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />{error}</div>}

          <button style={S.btnDanger} onClick={handleCancel} disabled={cancelling}>
            {cancelling ? <><span style={S.spinner} />Cancelling…</> : <><i className="fa-solid fa-xmark" style={{ marginRight: 8 }} />Cancel Request</>}
          </button>
        </div>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCREEN — APPROVED (start button enabled)
══════════════════════════════════════════════════════════════ */
function ApprovedScreen({ permission, onStart }) {
  const [starting, setStarting] = useState(false);
  const [error,    setError]    = useState(null);

  const handleStart = async () => {
    setStarting(true); setError(null);
    try {
      const data = await api.start(permission.id);
      if (data.success) onStart(data.permission);
      else setError(data.message || "Failed to start.");
    } catch { setError("Network error."); }
    finally { setStarting(false); }
  };

  return (
    <main className="app-main">
      <div className="cf-page-wrapper">
        <div className="cf-card">
          <div className="cf-form-header">
            <h2 className="cf-form-title">
              <i className="fa-solid fa-circle-check domain-icon" />
              Permission Approved
            </h2>
          </div>

          {/* Approved banner */}
          <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 12, padding: "20px", textAlign: "center", marginBottom: 24 }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: 32, color: "#16a34a", marginBottom: 10, display: "block" }} />
            <div style={{ fontWeight: 700, color: "#15803d", fontSize: 15, marginBottom: 6 }}>Your request has been approved!</div>
            <div style={{ fontSize: 13, color: "#166534" }}>
              Click <strong>Start Permission</strong> when you are ready to leave.
            </div>
          </div>

          {/* Auto-filled details — read only */}
          <Section title="Permission Details" icon="fa-solid fa-circle-info">
            <InfoRow label="Permission Type"><Badge value={permission.permission_type} /></InfoRow>
            <InfoRow label="Planned Date">{fmtDate(permission.date)}</InfoRow>
            <InfoRow label="Expected Return">{fmtFull(permission.expected_end_time)}</InfoRow>
            <InfoRow label="Reason">{permission.reason}</InfoRow>
            {permission.admin_remarks && <InfoRow label="Admin Remarks">{permission.admin_remarks}</InfoRow>}
          </Section>

          {error && <div style={S.errBox}><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />{error}</div>}

          <button style={S.btnGreen} onClick={handleStart} disabled={starting}>
            {starting
              ? <><span style={S.spinner} />Starting…</>
              : <><i className="fa-solid fa-person-walking" style={{ marginRight: 8 }} />Start Permission Now</>}
          </button>
        </div>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCREEN — ACTIVE PERMISSION
══════════════════════════════════════════════════════════════ */
function ActivePermission({ permission, onComplete }) {
  const elapsed = useElapsed(permission.start_time);
  const { coords, setCoords, gpsErr, loading: gpsLoading, getLocation } = useGPS();
  const [photo,      setPhoto]      = useState(null);
  const [showReturn, setShowReturn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);

  const isMidDay = permission.permission_type === "MID_DAY";
  const isEndDay = permission.permission_type === "END_DAY";

  const handleComplete = async () => {
    setError(null);
    if (isMidDay && !photo)  { setError("Please capture your selfie photo first."); return; }
    if (isMidDay && !coords) { setError("Please capture your GPS location first."); return; }
    setSubmitting(true);
    try {
      const form = new FormData();
      if (isMidDay) { form.append("return_image", photo); form.append("latitude", coords.lat); form.append("longitude", coords.lon); }
      const data = await api.complete(permission.id, form);
      if (data.success || data.permission) onComplete(data.permission);
      else setError(data.message || Object.values(data.errors || {}).flat().join(" ") || "Failed.");
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <main className="app-main">
      <div className="cf-page-wrapper">
        <div style={S.timerBlock}>
          <div style={S.timerSub}><i className="fa-solid fa-clock" style={{ marginRight: 6 }} />Time Elapsed</div>
          <div style={S.timerNum}>{elapsed}</div>
          <div style={S.timerSub}>since departure</div>
        </div>

        <div className="cf-card">
          <div className="cf-form-header">
            <h2 className="cf-form-title">
              <i className="fa-solid fa-person-walking domain-icon" />
              Active Permission
            </h2>
          </div>

          <Section title="Permission Info" icon="fa-solid fa-circle-info">
            <InfoRow label="Status"><Badge value="ACTIVE" /></InfoRow>
            <InfoRow label="Type"><Badge value={permission.permission_type} /></InfoRow>
            {permission.request_type && <InfoRow label="Request Type"><Badge value={permission.request_type} /></InfoRow>}
            <InfoRow label="Date">{fmtDate(permission.date)}</InfoRow>
            <InfoRow label="Departed">{fmtTime(permission.start_time)}</InfoRow>
            <InfoRow label="Expected Return">{fmtFull(permission.expected_end_time)}</InfoRow>
            <InfoRow label="Reason">{permission.reason}</InfoRow>
          </Section>

          {isEndDay && (
            <div style={{ background: "#f3e8ff", border: "1px solid #d8b4fe", borderRadius: 10, padding: "16px 18px", textAlign: "center", marginBottom: 14 }}>
              <i className="fa-solid fa-moon" style={{ fontSize: 26, color: "#7c3aed", marginBottom: 8, display: "block" }} />
              <div style={{ fontWeight: 700, color: "#7c3aed", fontSize: 14, marginBottom: 4 }}>Auto-Completes at Shift End</div>
              <div style={{ fontSize: 12, color: "#9f7aea" }}>No action needed. Permission closes automatically when your shift ends.</div>
            </div>
          )}

          {isMidDay && !showReturn && (
            <button style={S.btnOrange} onClick={() => setShowReturn(true)}>
              <i className="fa-solid fa-check" style={{ marginRight: 8 }} />I'm Back — Complete Permission
            </button>
          )}

          {isMidDay && showReturn && (
            <Section title="Verify Your Return" icon="fa-solid fa-location-dot">
              {error && <div style={S.errBox}><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />{error}</div>}
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}><i className="fa-solid fa-camera" style={{ marginRight: 6 }} />Selfie Photo (required)</label>
                <CameraCapture onCapture={setPhoto} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}><i className="fa-solid fa-location-dot" style={{ marginRight: 6 }} />GPS Location (required)</label>
                {coords ? (
                  <div style={S.gpsBox}>
                    <i className="fa-solid fa-location-dot" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>Location Captured</div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>{coords.lat.toFixed(5)}, {coords.lon.toFixed(5)} · ±{coords.acc}m</div>
                    </div>
                    <button onClick={() => { setCoords(null); getLocation(); }} disabled={gpsLoading} style={{ background: "none", border: "none", cursor: "pointer", color: "#16a34a", fontSize: 11, fontWeight: 600, textDecoration: "underline", padding: 0, fontFamily: "inherit" }}>
                      {gpsLoading ? "Refreshing…" : <><i className="fa-solid fa-rotate-left" style={{ marginRight: 4 }} />Retry</>}
                    </button>
                  </div>
                ) : (
                  <>
                    {gpsErr && <p style={S.errText}><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }} />{gpsErr}</p>}
                    <button style={S.btnOutline} onClick={getLocation} disabled={gpsLoading}>
                      {gpsLoading ? <><span style={S.spinner} />Getting location…</> : <><i className="fa-solid fa-location-crosshairs" style={{ marginRight: 6 }} />Get My Location</>}
                    </button>
                  </>
                )}
              </div>
              <button style={{ ...S.btnPrimary, opacity: (submitting || !photo || !coords) ? 0.6 : 1 }} onClick={handleComplete} disabled={submitting || !photo || !coords}>
                {submitting ? <><span style={S.spinner} />Submitting…</> : <><i className="fa-solid fa-circle-check" style={{ marginRight: 8 }} />Submit &amp; Complete</>}
              </button>
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCREEN — RESULT
══════════════════════════════════════════════════════════════ */
function ResultScreen({ permission, onNew }) {
  const isCompleted = permission.status === "COMPLETED";
  const isRejected  = permission.status === "REJECTED";
  return (
    <main className="app-main">
      <div className="cf-page-wrapper">
        <div className="cf-card">
          <div className="cf-form-header">
            <h2 className="cf-form-title">
              <i className={`domain-icon fa-solid ${isCompleted ? "fa-circle-check" : "fa-circle-xmark"}`} />
              {isCompleted ? "Permission Completed" : "Permission Rejected"}
            </h2>
          </div>

          {isRejected && (
            <div style={S.errBox}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
              Your return location was outside the allowed office radius.
            </div>
          )}

          <Section title="Summary" icon="fa-solid fa-file-lines">
            <InfoRow label="Status"><Badge value={permission.status} /></InfoRow>
            <InfoRow label="Type"><Badge value={permission.permission_type} /></InfoRow>
            <InfoRow label="Date">{fmtDate(permission.date)}</InfoRow>
            <InfoRow label="Departed">{fmtTime(permission.start_time)}</InfoRow>
            <InfoRow label="Returned">{fmtTime(permission.actual_end_time)}</InfoRow>
            <InfoRow label="Duration">{permission.duration_display || "—"}</InfoRow>
            {permission.usage_flag && <InfoRow label="Usage Flag"><Badge value={permission.usage_flag} /></InfoRow>}
          </Section>

          <button style={S.btnPrimary} onClick={onNew}>
            <i className="fa-solid fa-plus" style={{ marginRight: 8 }} />Request New Permission
          </button>
        </div>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════
   ADMIN VIEW — all permissions table + approve/reject for PENDING
══════════════════════════════════════════════════════════════ */
function AdminView() {
  const [list,       setList]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [reviewing,  setReviewing]  = useState(null);   // { id, action } while in-flight
  const [remarkMap,  setRemarkMap]  = useState({});     // { [id]: string }
  const [filters,    setFilters]    = useState({ status: "", type: "", request_type: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filters.status)       qs.append("status",       filters.status);
      if (filters.type)         qs.append("type",         filters.type);
      if (filters.request_type) qs.append("request_type", filters.request_type);
      const data = await api.getList(qs.toString());
      setList(data.permissions || []);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async (id, action) => {
    setReviewing({ id, action });
    try {
      const data = await api.review(id, { status: action, admin_remarks: remarkMap[id] || "" });
      if (data.success) {
        setList((prev) => prev.map((p) => p.id === id ? data.permission : p));
        setRemarkMap((prev) => { const { [id]: _, ...rest } = prev; return rest; });
      }
    } catch { /* ignore */ }
    finally { setReviewing(null); }
  };

  const pendingCount = list.filter((p) => p.status === "PENDING").length;

  return (
    <main className="app-main">
      <div className="cf-page-wrapper" style={{ maxWidth: 1100 }}>
        <div className="cf-card">
          <div className="cf-form-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <h2 className="cf-form-title">
                <i className="fa-solid fa-table-list domain-icon" />
                All Permissions
                {pendingCount > 0 && (
                  <span style={{ marginLeft: 10, background: "#f59e0b", color: "#fff", borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "2px 10px" }}>
                    {pendingCount} pending
                  </span>
                )}
              </h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select style={S.filterSel} value={filters.request_type} onChange={(e) => setFilters((f) => ({ ...f, request_type: e.target.value }))}>
                  <option value="">All Request Types</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="PREPLANNED">Pre-planned</option>
                </select>
                <select style={S.filterSel} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <select style={S.filterSel} value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
                  <option value="">All Types</option>
                  <option value="MID_DAY">Mid Day</option>
                  <option value="END_DAY">End Day</option>
                </select>
                <button style={S.btnSm()} onClick={load}><i className="fa-solid fa-arrows-rotate" style={{ marginRight: 6 }} />Refresh</button>
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #f0f0f0" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}><span style={S.spinner} /> Loading…</div>
            ) : list.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: "#ccc" }}>
                <i className="fa-solid fa-clipboard-list" style={{ fontSize: 32, marginBottom: 8, display: "block" }} />
                <div>No permissions found</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#fafafa" }}>
                  <tr>
                    {["Employee", "Date", "Perm Type", "Request", "Departed", "Expected Return", "Status", "Flag", "Action"].map((h) => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => {
                    const isPending   = p.status === "PENDING";
                    const isActioning = reviewing?.id === p.id;
                    return (
                      <tr key={p.id} onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fbff")} onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                        <td style={S.td}>
                          <div style={{ fontWeight: 700, color: "#222" }}>{p.employee_name || "—"}</div>
                          <div style={{ fontSize: 11, color: "#aaa" }}>{p.employee_code}</div>
                        </td>
                        <td style={S.td}>{fmtDate(p.date)}</td>
                        <td style={S.td}><Badge value={p.permission_type} /></td>
                        <td style={S.td}><Badge value={p.request_type} /></td>
                        <td style={S.td}>{p.start_time ? fmtTime(p.start_time) : <span style={{ color: "#ccc" }}>—</span>}</td>
                        <td style={S.td}>{fmtFull(p.expected_end_time)}</td>
                        <td style={S.td}><Badge value={p.status} /></td>
                        <td style={S.td}>{p.usage_flag ? <Badge value={p.usage_flag} /> : <span style={{ color: "#ddd" }}>—</span>}</td>
                        <td style={{ ...S.td, minWidth: 200 }}>
                          {isPending ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <input
                                placeholder="Remarks (optional)"
                                value={remarkMap[p.id] || ""}
                                onChange={(e) => setRemarkMap((m) => ({ ...m, [p.id]: e.target.value }))}
                                style={{ ...S.input, padding: "6px 10px", fontSize: 12 }}
                              />
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  style={{ ...S.btnSm("#16a34a"), flex: 1, opacity: isActioning ? 0.6 : 1 }}
                                  onClick={() => handleReview(p.id, "APPROVED")}
                                  disabled={isActioning}
                                >
                                  {isActioning && reviewing.action === "APPROVED" ? <span style={S.spinner} /> : <i className="fa-solid fa-check" style={{ marginRight: 4 }} />}
                                  Approve
                                </button>
                                <button
                                  style={{ ...S.btnSm("#dc2626"), flex: 1, opacity: isActioning ? 0.6 : 1 }}
                                  onClick={() => handleReview(p.id, "REJECTED")}
                                  disabled={isActioning}
                                >
                                  {isActioning && reviewing.action === "REJECTED" ? <span style={S.spinner} /> : <i className="fa-solid fa-xmark" style={{ marginRight: 4 }} />}
                                  Reject
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {p.admin_remarks
                                ? <span style={{ fontSize: 12, color: "#666" }}>{p.admin_remarks}</span>
                                : <span style={{ color: "#ddd" }}>—</span>}
                              {p.reviewed_by_name && (
                                <div style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>by {p.reviewed_by_name}</div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════ */
export default function Permission() {
  const [screen,     setScreen] = useState("loading");
  const [permission, setPerm]   = useState(null);
  const [isAdmin,    setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/me/", { credentials: "include" });
        const data = await res.json();
        setIsAdmin(data.is_superuser || false);
      } catch { setIsAdmin(false); }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setScreen("admin");
      return;
    }

    api.getActive()
      .then((data) => {
        if (data.active) {
          setPerm(data.active);
          const s = data.active.status;
          if      (s === "PENDING")   setScreen("pending");
          else if (s === "APPROVED")  setScreen("approved");
          else if (s === "ACTIVE")    setScreen("active");
          else                        setScreen("result");
        } else {
          setScreen("request");
        }
      })
      .catch(() => setScreen("request"));
  }, [isAdmin]);

  return (
    <>
      <style>{`
        .cf-page-wrapper { width:100%; max-width:900px; margin-inline:auto; padding:8px 16px 40px; box-sizing:border-box; }
        .cf-card { margin-top:113px; width:100%; background:#fff; border-radius:16px; box-shadow:0 4px 6px rgba(0,0,0,.07),0 2px 4px rgba(0,0,0,.05); padding:32px; box-sizing:border-box; }
        .cf-form-header { padding-bottom:14px; border-bottom:2px solid var(--accent,#ff9800); margin-bottom:28px; }
        .cf-form-title  { font-size:clamp(16px,3vw,22px); font-weight:700; color:var(--primary,#0b91ac); display:flex; align-items:center; gap:8px; margin:0; }
        .domain-icon { color:var(--primary,#0b91ac); }
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        .perm-fade { animation:fadeUp 0.28s ease both; }
        button:hover:not(:disabled) { filter:brightness(0.93); }
        button:active:not(:disabled) { transform:scale(0.985); }
        button:disabled { opacity:.55; cursor:not-allowed; }
        input:focus, textarea:focus { border-color:#0b91ac !important; outline:none; }
        select:focus { outline:none; border-color:#0b91ac; }
        @media (max-width:767px) { .cf-page-wrapper { padding:6px 10px 32px; } .cf-card { padding:18px; border-radius:12px; } }
        @media (max-width:479px) { .cf-card { padding:14px; border-radius:10px; } }
      `}</style>

      <div className="perm-fade" key={screen}>
        {screen === "loading" && (
          <div style={{ textAlign: "center", paddingTop: 80, color: "#aaa" }}>
            <span style={S.spinner} /> Checking permissions…
          </div>
        )}
        {screen === "admin" && <AdminView />}
        {screen === "request" && (
          <RequestForm
            onSuccess={(p) => {
              setPerm(p);
              // Emergency → active, Preplanned → pending
              setScreen(p.status === "ACTIVE" ? "active" : "pending");
            }}
          />
        )}
        {screen === "pending" && permission && (
          <PendingScreen
            permission={permission}
            onCancel={() => { setPerm(null); setScreen("request"); }}
          />
        )}
        {screen === "approved" && permission && (
          <ApprovedScreen
            permission={permission}
            onStart={(p) => { setPerm(p); setScreen("active"); }}
          />
        )}
        {screen === "active" && permission && (
          <ActivePermission
            permission={permission}
            onComplete={(p) => { setPerm(p); setScreen("result"); }}
          />
        )}
        {screen === "result" && permission && (
          <ResultScreen
            permission={permission}
            onNew={() => { setPerm(null); setScreen("request"); }}
          />
        )}
      </div>
    </>
  );
}