import React from 'react';

const StationDetailsModal = ({ isOpen, onClose, stationData, onDelete }) => {
    if (!isOpen || !stationData) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{stationData.name} (ID: {stationData.id})</h3>
                <p>Price: {stationData.price}</p>
                <p>Charge Level: {stationData.charge_level}</p>
                <p>Connector Type: {stationData.connector_type}</p>
                <p>Latitude: {stationData.latitude}, Longitude: {stationData.longitude}</p>
                
                <h4>Site Details</h4>
                <p>Site ID: {stationData.site_id}</p>
                <p>Address: {stationData.street_address}, {stationData.city}, {stationData.state} {stationData.zip_code}</p>
                
                <button className="edit-button" onClick={() => {/* Handle edit */}}>Edit</button>
                <button className="delete-button" onClick={() => onDelete(stationData.id)}>Delete</button>
                <button className="close-button" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default StationDetailsModal;
