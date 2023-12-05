import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api';
import '../scss/StationManagement.scss';
import Modal from '../components/Modal';
import StationDetailsModal from '../components/StationDetailsModal';

const StationManagement = () => {
    const [stations, setStations] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        chargeLevel: '',
        connectorType: '',
        latitude: '',
        longitude: '',
        siteId: ''
    });
    const [siteOptions, setSiteOptions] = useState([]);
    const [message, setMessage] = useState('');
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

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
        const station = stations.find(s => s.id === stationId);
        setSelectedStation(station);
        setIsDetailsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddStation = () => {
        const data = {
            name: formData.name,
            charge_level: formData.chargeLevel,
            connector_type: formData.connectorType,
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
            site_id: formData.siteId
        };

        apiInstance.post('http://127.0.0.1:5000/api/stations', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            setMessage(response.data.message);
            setIsModalOpen(false);
            setIsMessageModalOpen(true);
        }).catch(error => {
            console.error('Error:', error);
            setMessage('Error adding station');
            setIsModalOpen(false);
            setIsMessageModalOpen(true);
        });
    };

    const handleDeleteStation = (stationId) => {
        apiInstance.delete(`http://127.0.0.1:5000/api/stations/${stationId}`)
            .then(response => {
                console.log('Station deleted:', response);
                setIsDetailsModalOpen(false);
                window.location.reload();
            })
            .catch(error => console.error('Error:', error));
    };

    const handleCloseMessageModal = () => {
        setIsMessageModalOpen(false);
        window.location.reload();
    };

    return (
        <div>
            <button onClick={() => setIsModalOpen(true)}>Add Station</button>

            {/* Stations List */}
            <h2>Stations List</h2>
            <ul className="station-list">
                {stations.map(station => (
                    <li key={station.id} className="station-list-item" onClick={() => handleStationClick(station.id)}>
                        ID: {station.id}, Name: {station.name}
                    </li>
                ))}
            </ul>

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

            {/* Station Details Modal */}
            <StationDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                stationData={selectedStation}
                onDelete={() => handleDeleteStation(selectedStation.id)}
            />

            {/* Message Modal */}
            <Modal 
                isOpen={isMessageModalOpen} 
                onClose={handleCloseMessageModal}
                className="message-modal-content"
            >
                <p>{message}</p>
            </Modal>
        </div>
    );
};

export default StationManagement;
