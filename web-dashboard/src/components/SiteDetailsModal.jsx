import React from 'react';
import '../scss/Modal.scss';

const SiteDetailsModal = ({ isOpen, onClose, siteData }) => {
    if (!isOpen || !siteData) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Site Details</h3>
                <p>Site ID: {siteData.id}</p>
                <p>Address: {siteData.street_address}, {siteData.city}, {siteData.state} {siteData.zip_code}</p>
                
                <button className="close-button" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default SiteDetailsModal;
