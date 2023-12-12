import React, { useState, useEffect } from 'react';
import '../scss/Modal.scss';

const SiteEditModal = ({ isOpen, onClose, siteData, onSave }) => {
    const [editedName, setEditedName] = useState('');
    const [editedPrice, setEditedPrice] = useState('');

    useEffect(() => {
        if (siteData) {
            setEditedName(siteData.name || '');
        }
    }, [siteData]);

    if (!isOpen) return null;

    const handleSave = () => {
        // Add validation if needed
        onSave(siteData.id, editedName);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <label htmlFor="siteName">Site Name</label>
                <input 
                    id="siteName"
                    type="text" 
                    value={editedName} 
                    onChange={(e) => setEditedName(e.target.value)}
                />
                <button onClick={handleSave}>Save</button>
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default SiteEditModal;
