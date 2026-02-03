import React from "react";
import ReactDOM from "react-dom";

export default function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
