import React, { useState, useEffect } from 'react';
import '../scss/Modal.scss';

const StationEditModal = ({ isOpen, onClose, stationData, onSave }) => {
    const [editedName, setEditedName] = useState('');
    const [editedPrice, setEditedPrice] = useState('');

    useEffect(() => {
        if (stationData) {
            setEditedName(stationData.name || '');
            setEditedPrice(stationData.price || '');
        }
    }, [stationData]);

    if (!isOpen) return null;

    const handleSave = () => {
        // Add validation if needed
        onSave(stationData.id, editedName, parseFloat(editedPrice));
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <label htmlFor="stationName">Station Name</label>
                <input 
                    id="stationName"
                    type="text" 
                    value={editedName} 
                    onChange={(e) => setEditedName(e.target.value)}
                />
                <label htmlFor="stationPrice">Station Price</label>
                <input 
                    id="stationPrice"
                    type="number"
                    value={editedPrice} 
                    onChange={(e) => setEditedPrice(e.target.value)}
                />
                <button onClick={handleSave}>Save</button>
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default StationEditModal;
