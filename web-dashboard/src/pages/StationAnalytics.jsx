import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api';
import '../scss/StationManagement.scss';
import Modal from '../components/Modal';
import StationAnalyticsModal from '../components/StationAnalyticsModal';

const StationManagement = () => {
    const [stations, setStations] = useState([]);
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);

    useEffect(() => {
        apiInstance.get('http://127.0.0.1:5000/api/stations')
            .then(response => {
                setStations(response.data);
            })
            .catch(error => console.error('Error:', error));
    }, []);

    const handleStationClick = (stationId) => {
        console.log('Station clicked:', stationId);
        setSelectedStation(stationId);
        setIsAnalyticsModalOpen(true);
    };

    return (
        <div>
            {/* Stations List */}
            <h2>Stations List</h2>
            <ul className="station-list">
                {stations.map(station => (
                    <li key={station.id} className="station-list-item" onClick={() => handleStationClick(station.id)}>
                        ID: {station.id}, Name: {station.name}
                    </li>
                ))}
            </ul>

            {/* Station Analytics Modal */}
            <StationAnalyticsModal
                isOpen={isAnalyticsModalOpen}
                onClose={() => setIsAnalyticsModalOpen(false)}
                stationId={selectedStation}
            />
        </div>
    );
};

export default StationManagement;
