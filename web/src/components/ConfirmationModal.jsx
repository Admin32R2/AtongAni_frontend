import "./ConfirmationModal.css";

export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Delete",
  cancelText = "Cancel",
  isDangerous = false
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button 
            onClick={onCancel}
            className="modal-btn modal-btn-cancel"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`modal-btn ${isDangerous ? 'modal-btn-danger' : 'modal-btn-confirm'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
