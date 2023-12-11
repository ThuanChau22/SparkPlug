import React, { useState, useEffect } from 'react';
import '../scss/Modal.scss'; // Adjust the path if necessary

const SiteAddModal = ({ isOpen, onClose, onAddsite, fetchSites }) => {
    const [formData, setFormData] = useState({
        name: '',
        ownerId: '',
        streetAddress: '',
        latitude: '',
        longitude: '',
        zipCode: ''
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

        const apiUrl = 'http://127.0.0.1:5000/api/sites';
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: formData.name,
                owner_id: Number(formData.ownerId),
                street_address: formData.streetAddress,
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude),
                zip_code: formData.zipCode
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Response Data:", data); // Debugging line
            onClose(); // Close the modal after submission
            window.location.reload();
        })
        .catch(error => console.error('Error:', error));
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <form onSubmit={handleSubmit}>
                    {/* Form fields for site data */}
                    <input type="text" name="name" placeholder="Name" onChange={handleInputChange} value={formData.name} />
                    <input type="text" name="ownerId" placeholder="Owner ID" onChange={handleInputChange} value={formData.owner_id} />
                    <input type="text" name="streetAddress" placeholder="Street Address" onChange={handleInputChange} value={formData.streetAddress} />
                    <input type="text" name="latitude" placeholder="Latitude" onChange={handleInputChange} value={formData.latitude} />
                    <input type="text" name="longitude" placeholder="Longitude" onChange={handleInputChange} value={formData.longitude} />
                    <input type="text" name="zipCode" placeholder="Zip Code" onChange={handleInputChange} value={formData.zipCode} />
                    <button type="submit">Add Site</button>
                </form>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default SiteAddModal;
