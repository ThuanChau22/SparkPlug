import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api';
import '../scss/StationManagement.scss';

// Other imports
import Modal from '../components/Modal'; // Adjust the path as necessary

const StationManagement = () => {
    const [stations, setStations] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
        apiInstance.get('http://127.0.0.1:5000/api/stations')
            .then(response => {
                setStations(response.data);
            })
            .catch(error => console.error('Error:', error));

        apiInstance.get('http://127.0.0.1:5000/api/sites')
            .then(response => {
                setSiteOptions(response.data.map(site => site.id));
            })
            .catch(error => console.error('Error:', error));
    }, []);

    const handleStationClick = (stationId) => {
        console.log(`Station clicked: ${stationId}`);
        // Implement further actions here
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddStation = () => {
        console.log(formData); // Implement the logic to add the station
        setIsModalOpen(false); // Close the modal after adding
    };

    return (
        <div>
            <button onClick={() => setIsModalOpen(true)}>Add Station</button>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {/* Form for adding a station */}
                <form>
                    <input type="text" name="name" placeholder="Name" onChange={handleInputChange} />
                    <select name="chargeLevel" onChange={handleInputChange}>
                        <option value="">Select Charge Level</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                    <input type="text" name="connectorType" placeholder="Connector Type" onChange={handleInputChange} />
                    <input type="text" name="latitude" placeholder="Latitude" onChange={handleInputChange} />
                    <input type="text" name="longitude" placeholder="Longitude" onChange={handleInputChange} />
                    <select name="siteId" onChange={handleInputChange}>
                        <option value="">Select Site ID</option>
                        {siteOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    <button type="button" onClick={handleAddStation}>Add</button>
                </form>
            </Modal>
            {/* Stations list */}
            <h2>Stations List</h2>
            <ul>
                {stations.map(station => (
                    <li key={station.id} onClick={() => handleStationClick(station.id)}>
                        ID: {station.id}, Name: {station.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StationManagement;

