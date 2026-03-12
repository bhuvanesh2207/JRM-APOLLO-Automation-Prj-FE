import React from "react";
import { MdClose } from "react-icons/md";
import {
  AiOutlineInfoCircle,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineWarning,
  AiOutlineDelete,
} from "react-icons/ai";

const Popup = ({
  show,
  type = "info", // info | success | warning | error | delete
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
}) => {
  if (!show) return null;

  const stopPropagation = (e) => e.stopPropagation();

  const handleBackdropClick = () => {
    if (type !== "delete" && !showCancel) {
      onClose();
    }
  };

  const renderIcon = () => {
    const iconProps = { size: 40 };

    switch (type) {
      case "success":
        return (
          <div className="popup-icon popup-icon--success">
            <AiOutlineCheckCircle {...iconProps} />
          </div>
        );
      case "error":
        return (
          <div className="popup-icon popup-icon--error">
            <AiOutlineCloseCircle {...iconProps} />
          </div>
        );
      case "warning":
        return (
          <div className="popup-icon popup-icon--warning">
            <AiOutlineWarning {...iconProps} />
          </div>
        );
      case "delete":
        return (
          <div className="popup-icon popup-icon--delete">
            <AiOutlineDelete {...iconProps} />
          </div>
        );
      default:
        return (
          <div className="popup-icon popup-icon--info">
            <AiOutlineInfoCircle {...iconProps} />
          </div>
        );
    }
  };

  return (
    <div className="popup-backdrop" onClick={handleBackdropClick}>
      <div
        className={`popup-box popup-box--${type}`}
        onClick={stopPropagation}
        role="dialog"
        aria-modal="true"
      >
        {type !== "delete" && (
          <button
            className="popup-close-btn"
            onClick={onClose}
            aria-label="Close popup"
            type="button"
          >
            <MdClose size={20} />
          </button>
        )}

        {renderIcon()}

        <div className="popup-content">
          {title && <h3 className="popup-title">{title}</h3>}
          {message && <p className="popup-message">{message}</p>}
        </div>

        <div className="popup-actions">
          {(showCancel || type === "delete") && (
            <button
              className="popup-btn popup-btn--cancel"
              onClick={onClose}
              type="button"
            >
              {cancelText}
            </button>
          )}

          <button
            className={`popup-btn popup-btn--${type}`}
            onClick={onConfirm || onClose}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
