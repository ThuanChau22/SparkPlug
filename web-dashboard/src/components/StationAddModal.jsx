import React, { useState, useEffect } from 'react';
import '../scss/Modal.scss'; // Adjust the path if necessary

const StationAddModal = ({ isOpen, onClose, onAddStation, onRefresh }) => {
    const [formData, setFormData] = useState({
        name: '',
        chargeLevel: '',
        connectorType: '',
        latitude: '',
        longitude: '',
        siteId: ''
    });
    const [siteOptions, setSiteOptions] = useState([]);

    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/sites')
            .then(response => response.json())
            .then(data => {
                const siteIds = data.map(site => site.id);
                setSiteOptions(siteIds);
            })
            .catch(error => console.error('Error:', error));
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (event) => {
        event.preventDefault(); // Prevent default form submission behavior

        const apiUrl = 'http://127.0.0.1:5000/api/stations';
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: formData.name,
                charge_level: Number(formData.chargeLevel),
                connector_type: formData.connectorType,
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude),
                site_id: formData.siteId ? Number(formData.siteId) : null
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Response Data:", data); // Debugging line
            onClose(); // Close the modal after submission
            onRefresh();
        })
        .catch(error => console.error('Error:', error));
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <form onSubmit={handleSubmit}>
                    {/* Form fields for station data */}
                    <input type="text" name="name" placeholder="Name" onChange={handleInputChange} value={formData.name} />
                    <select name="chargeLevel" onChange={handleInputChange} value={formData.chargeLevel}>
                        <option value="">Select Charge Level</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                    <input type="text" name="connectorType" placeholder="Connector Type" onChange={handleInputChange} value={formData.connectorType} />
                    <input type="text" name="latitude" placeholder="Latitude" onChange={handleInputChange} value={formData.latitude} />
                    <input type="text" name="longitude" placeholder="Longitude" onChange={handleInputChange} value={formData.longitude} />
                    <select name="siteId" onChange={handleInputChange} value={formData.siteId}>
                        <option value="">Select Site ID</option>
                        {siteOptions.map((id) => (
                            <option key={id} value={id}>{id}</option>
                        ))}
                    </select>
                    <button type="submit">Add Station</button>
                </form>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default StationAddModal;
