import React from 'react';
import '../scss/Modal.scss';

const StationDetailsModal = ({ isOpen, onClose, stationData }) => {
    if (!isOpen || !stationData) return null;

    // Example of currency formatting (adjust locale and currency as needed)
    const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stationData.price);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{stationData.name} (ID: {stationData.id})</h3>
                <p>Price: {formattedPrice}</p>
                <p>Charge Level: {stationData.charge_level}</p>
                <p>Connector Type: {stationData.connector_type}</p>
                <p>Location: Latitude: {stationData.latitude}, Longitude: {stationData.longitude}</p>
                
                <h4>Site Details</h4>
                <p>Site ID: {stationData.site_id}</p>
                <p>Address: {stationData.street_address}, {stationData.city}, {stationData.state} {stationData.zip_code}</p>
                
                <button className="close-button" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default StationDetailsModal;
