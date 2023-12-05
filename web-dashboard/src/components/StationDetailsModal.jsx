import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api'; // Adjust the path as necessary

const StationDetailsModal = ({ isOpen, onClose, stationData, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedPrice, setEditedPrice] = useState('');

    useEffect(() => {
        if (stationData) {
            setEditedName(stationData.name);
            setEditedPrice(stationData.price);
        }
    }, [stationData]);

    if (!isOpen || !stationData) return null;

    const handleSave = () => {
        apiInstance.patch(`http://127.0.0.1:5000/api/stations/${stationData.id}`, {
            name: editedName,
            price: parseFloat(editedPrice)
        }).then(() => {
            window.location.reload();
        }).catch(error => console.error('Error:', error));
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {isEditing ? (
                    <>
                        <label htmlFor="stationName">Station Name:</label>
                        <input 
                            type="text" 
                            id="stationName" 
                            value={editedName} 
                            onChange={(e) => setEditedName(e.target.value)} 
                        />
                        <label htmlFor="stationPrice">Station Price:</label>
                        <input 
                            type="number" 
                            id="stationPrice" 
                            value={editedPrice} 
                            onChange={(e) => setEditedPrice(e.target.value)}
                            step="0.01" 
                        />
                        <button onClick={handleSave}>Save</button>
                        <button onClick={() => setIsEditing(false)}>Cancel</button>
                    </>
                ) : (
                    <>
                        <h3>{stationData.name} (ID: {stationData.id})</h3>
                        <p>Price: {stationData.price}</p>
                        <p>Charge Level: {stationData.charge_level}</p>
                        <p>Connector Type: {stationData.connector_type}</p>
                        <p>Latitude: {stationData.latitude}, Longitude: {stationData.longitude}</p>
                        
                        <h4>Site Details</h4>
                        <p>Site ID: {stationData.site_id}</p>
                        <p>Address: {stationData.street_address}, {stationData.city}, {stationData.state} {stationData.zip_code}</p>
                        
                        <button className="edit-button" onClick={() => setIsEditing(true)}>Edit</button>
                        <button className="delete-button" onClick={() => onDelete(stationData.id)}>Delete</button>
                        <button className="close-button" onClick={onClose}>Close</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default StationDetailsModal;
