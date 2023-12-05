import React from 'react';
import '../scss/Modal.scss'

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {children}
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default Modal;
