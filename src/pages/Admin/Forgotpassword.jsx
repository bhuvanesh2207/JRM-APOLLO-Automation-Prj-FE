import React, { useState, useRef, useEffect } from "react";
import api from "../../api/axios";

const STEP = { EMAIL: "email", OTP: "otp", RESET: "reset", SUCCESS: "success" };

const IconMail = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="2,4 12,13 22,4" />
  </svg>
);
const IconLock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconEye = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const IconCheck = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function OTPInput({ value, onChange, length = 6 }) {
  const inputs = useRef([]);
  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = value.split(""); arr[i] = val;
    onChange(arr.join(""));
    if (val && i < length - 1) inputs.current[i + 1]?.focus();
  };
  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      const arr = value.split(""); arr[i - 1] = ""; onChange(arr.join(""));
    }
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted.padEnd(length, "").slice(0, length));
    inputs.current[Math.min(pasted.length, length - 1)]?.focus();
  };
  return (
    <div className="fp-otp-row">
      {Array.from({ length }).map((_, i) => (
        <input key={i} ref={(el) => (inputs.current[i] = el)} type="text" inputMode="numeric"
          maxLength={1} value={value[i] || ""} onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)} onPaste={handlePaste}
          className={`fp-otp-box${value[i] ? " fp-otp-box--filled" : ""}`} />
      ))}
    </div>
  );
}

function Stepper({ step }) {
  const steps = [STEP.EMAIL, STEP.OTP, STEP.RESET];
  const labels = ["Email", "Verify OTP", "New "];
  const idx = steps.indexOf(step);
  return (
    <div className="fp-stepper">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="fp-step-item">
            <div className={`fp-step-dot${i === idx ? " fp-step-dot--active" : i < idx ? " fp-step-dot--done" : ""}`}>
              {i < idx ? "✓" : i + 1}
            </div>
            <span className={`fp-step-label${i <= idx ? " fp-step-label--active" : ""}`}>{labels[i]}</span>
          </div>
          {i < steps.length - 1 && <div className={`fp-step-line${i < idx ? " fp-step-line--done" : ""}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function Countdown({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const t = setInterval(() => setLeft((p) => { if (p <= 1) { clearInterval(t); onExpire?.(); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [seconds]);
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  return <span className={`fp-timer-count${left < 30 ? " fp-timer-count--urgent" : ""}`}>{m}:{s}</span>;
}

function StrengthBar({ password }) {
  const score = [/.{6,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  const colors = ["#ef4444", "#f97316", "#eab308", "#1abc9c"];
  const labels = ["Weak", "Fair", "Good", "Strong"];
  if (!password) return null;
  return (
    <div className="fp-strength">
      <div className="fp-strength-bars">
        {[0,1,2,3].map((i) => (
          <div key={i} className="fp-strength-bar" style={{ background: i < score ? colors[score-1] : undefined }} />
        ))}
      </div>
      <span className="fp-strength-label" style={{ color: colors[score-1] || "#ccc" }}>{labels[score-1] || ""}</span>
    </div>
  );
}

function Spinner() { return <span className="fp-spinner" />; }

export default function ForgotPassword({ onClose }) {
  const [step, setStep]             = useState(STEP.EMAIL);
  const [email, setEmail]           = useState("");
  const [otp, setOtp]               = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [showCf, setShowCf]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [otpExpired, setOtpExpired] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const clearErr = () => setError("");

  const handleSendOTP = async () => {
    if (!email.trim()) return setError("Please enter your email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email address.");
    setLoading(true); clearErr();
    try {
      await api.post("/api/admin/forgot-password/send-otp/", { email: email.trim().toLowerCase() });
      setStep(STEP.OTP); setOtpExpired(false);
    } catch (err) { setError(err.response?.data?.detail || "Failed to send OTP. Try again."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setLoading(true); clearErr(); setOtp(""); setOtpExpired(false); setResendCooldown(true);
    try {
      await api.post("/api/admin/forgot-password/send-otp/", { email: email.trim().toLowerCase() });
      setTimeout(() => setResendCooldown(false), 30000);
    } catch (err) { setError(err.response?.data?.detail || "Failed to resend OTP."); setResendCooldown(false); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) return setError("Please enter the complete 6-digit OTP.");
    setLoading(true); clearErr();
    try {
      await api.post("/api/admin/forgot-password/verify-otp/", { email: email.trim().toLowerCase(), otp });
      setStep(STEP.RESET);
    } catch (err) { setError(err.response?.data?.detail || "Invalid or expired OTP."); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!password) return setError("Please enter a new password.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true); clearErr();
    try {
      await api.post("/api/admin/forgot-password/reset/", { email: email.trim().toLowerCase(), otp, new_password: password });
      setStep(STEP.SUCCESS);
    } catch (err) { setError(err.response?.data?.detail || "Failed to reset password."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fp-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fp-modal" role="dialog" aria-modal="true">

        <button className="fp-close-btn" onClick={onClose} aria-label="Close"><IconClose /></button>

        <div className="fp-header">
          <div className={`fp-icon-wrap${step === STEP.SUCCESS ? " fp-icon-wrap--success" : ""}`}>
            {step === STEP.SUCCESS ? <IconCheck /> : <IconLock />}
          </div>
          <h2 className="fp-title">
            {step === STEP.EMAIL && "Forgot Password"}
            {step === STEP.OTP && "Verify OTP"}
            {step === STEP.RESET && "Reset Password"}
            {step === STEP.SUCCESS && "Password Reset!"}
          </h2>
          <p className="fp-subtitle">
            {step === STEP.EMAIL && "Enter your admin email to receive a one-time password."}
            {step === STEP.OTP && <><strong>{email}</strong> — check your inbox for the 6-digit code.</>}
            {step === STEP.RESET && "Choose a strong new password for your account."}
            {step === STEP.SUCCESS && "Your password has been updated. You can now log in."}
          </p>
        </div>

        {step !== STEP.SUCCESS && <Stepper step={step} />}

        {step === STEP.EMAIL && (
          <div className="fp-body">
            <div className="fp-field-wrap">
              <span className="fp-field-icon"><IconMail /></span>
              <input type="email" placeholder="admin@example.com" value={email} autoFocus
                onChange={(e) => { setEmail(e.target.value); clearErr(); }}
                onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                className="fp-field-input" />
            </div>
            {error && <p className="fp-error">{error}</p>}
            <button className="fp-btn" onClick={handleSendOTP} disabled={loading}>
              {loading ? <Spinner /> : "Send OTP"}
            </button>
          </div>
        )}

        {step === STEP.OTP && (
          <div className="fp-body">
            <OTPInput value={otp} onChange={(v) => { setOtp(v); clearErr(); }} />
            <div className="fp-timer-row">
              <span>OTP expires in &nbsp;</span>
              {!otpExpired
                ? <Countdown seconds={300} onExpire={() => setOtpExpired(true)} />
                : <span className="fp-timer-expired">Expired</span>}
            </div>
            {error && <p className="fp-error">{error}</p>}
            <button className="fp-btn" onClick={handleVerifyOTP} disabled={loading || otpExpired || otp.length < 6}>
              {loading ? <Spinner /> : "Verify OTP"}
            </button>
            <div className="fp-resend-row">
              <span>Didn't receive it?</span>
              <button className="fp-link-btn" onClick={handleResend} disabled={loading || resendCooldown}>
                {resendCooldown ? "Resend in 30s" : "Resend OTP"}
              </button>
            </div>
            <button className="fp-back-btn" onClick={() => { setStep(STEP.EMAIL); setOtp(""); clearErr(); }}>← Back</button>
          </div>
        )}

        {step === STEP.RESET && (
          <div className="fp-body">
            <div className="fp-field-wrap">
              <span className="fp-field-icon"><IconLock /></span>
              <input type={showPw ? "text" : "password"} placeholder="New password" value={password} autoFocus
                onChange={(e) => { setPassword(e.target.value); clearErr(); }} className="fp-field-input" />
              <button type="button" className="fp-eye-btn" onClick={() => setShowPw((p) => !p)}><IconEye open={showPw} /></button>
            </div>
            <div className="fp-field-wrap">
              <span className="fp-field-icon"><IconLock /></span>
              <input type={showCf ? "text" : "password"} placeholder="Confirm new password" value={confirm}
                onChange={(e) => { setConfirm(e.target.value); clearErr(); }}
                onKeyDown={(e) => e.key === "Enter" && handleReset()} className="fp-field-input" />
              <button type="button" className="fp-eye-btn" onClick={() => setShowCf((p) => !p)}><IconEye open={showCf} /></button>
            </div>
            <StrengthBar password={password} />
            {error && <p className="fp-error">{error}</p>}
            <button className="fp-btn" onClick={handleReset} disabled={loading}>
              {loading ? <Spinner /> : "Reset Password"}
            </button>
          </div>
        )}

        {step === STEP.SUCCESS && (
          <div className="fp-body" style={{ alignItems: "center", textAlign: "center" }}>
            <button className="fp-btn" onClick={onClose} style={{ marginTop: 8 }}>Back to Login</button>
          </div>
        )}
      </div>
    </div>
  );
}