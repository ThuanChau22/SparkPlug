import React from 'react';
import '../scss/Modal.scss'

const Modal = ({ isOpen, onClose, children, className }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className={`modal-content ${className}`}>
                {children}
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default Modal;
