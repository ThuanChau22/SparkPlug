import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api';
import '../scss/StationManagement.scss';
import Modal from '../components/Modal';
import StationDetailsModal from '../components/StationDetailsModal';
import StationEditModal from '../components/StationEditModal';
import StationAddModal from '../components/StationAddModal';

const StationManagement = () => {
    const [stations, setStations] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [editingStation, setEditingStation] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        chargeLevel: '',
        connectorType: '',
        latitude: '',
        longitude: '',
        siteId: ''
    });
    const [filterState, setFilterState] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [filterZip, setFilterZip] = useState('all');
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [zipCodes, setZipCodes] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchStations();
    }, []);

    const fetchStations = (queryParams = '') => {
        const url = `http://127.0.0.1:5000/api/stations${queryParams}`;
        console.log("HTTP Request URL:", url); // Log the URL to the console

        apiInstance.get(url)
            .then(response => {
                const fetchedStations = response.data;
                setStations(fetchedStations);

                if (!queryParams) {
                    const uniqueStates = [...new Set(fetchedStations.map(station => station.state))];
                    const uniqueCities = [...new Set(fetchedStations.map(station => station.city))];
                    const uniqueZips = [...new Set(fetchedStations.map(station => station.zip_code))];

                    setStates(['all', ...uniqueStates]);
                    setCities(['all', ...uniqueCities]);
                    setZipCodes(['all', ...uniqueZips]);
                }
            })
            .catch(error => console.error('Error:', error));
    };

    const handleStationClick = (stationId) => {
        const station = stations.find(s => s.id === stationId);
        setSelectedStation(station);
        setIsDetailsModalOpen(true);
    };

    const handleEditStation = (evt, station) => {
        evt.stopPropagation();
        setEditingStation(station);
        setIsDetailsModalOpen(false);
    };

    const handleDeleteStation = (evt, stationId) => {
        evt.stopPropagation();
        apiInstance.delete(`http://127.0.0.1:5000/api/stations/${stationId}`)
            .then(() => {
                setStations(stations.filter(station => station.id !== stationId));
            })
            .catch(error => console.error('Error:', error));
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

        apiInstance.post('http://127.0.0.1:5000/api/stations', data)
            .then(response => {
                setMessage(response.data.message);
                setIsAddModalOpen(false);
            })
            .catch(error => {
                setMessage('Error adding station');
                setIsAddModalOpen(false);
            });
    };

    const saveEditedStation = (id, name, price) => {
        apiInstance.patch(`http://127.0.0.1:5000/api/stations/${id}`, {
            name: name,
            price: parseFloat(price)
        }).then(() => {
            window.location.reload();
        }).catch(error => console.error('Error:', error));
    };

    const applyFilters = () => {
        let queryParams = [];

        if (filterZip !== 'all') {
            queryParams.push(`zip=${encodeURIComponent(filterZip)}`);
        } else {
            if (filterState !== 'all') {
                queryParams.push(`state=${encodeURIComponent(filterState)}`);
            }
            if (filterCity !== 'all') {
                queryParams.push(`city=${encodeURIComponent(filterCity)}`);
            }
        }

        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        fetchStations(queryString);
    };

        const handleZipChange = (e) => {
        const newZip = e.target.value;
        setFilterZip(newZip);
        if (newZip !== 'all') {
            setFilterState('all');
            setFilterCity('all');
        }
    };

    const handleStateChange = (e) => {
        const newState = e.target.value;
        setFilterState(newState);
        if (newState !== 'all') {
            setFilterZip('all');
        }
    };

    const handleCityChange = (e) => {
        const newCity = e.target.value;
        setFilterCity(newCity);
        if (newCity !== 'all') {
            setFilterZip('all');
        }
    };

    const refreshPage = () => {
        window.location.reload();
    };

    return (
        <div>
            <div className="filter-container">
                <label htmlFor="stateFilter">State:</label>
                <select id="stateFilter" value={filterState} onChange={(e) => handleStateChange(e)}>
                    {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>

                <label htmlFor="cityFilter">City:</label>
                <select id="cityFilter" value={filterCity} onChange={(e) => handleCityChange(e)}>
                    {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>

                <label htmlFor="zipFilter">Zip:</label>
                <select id="zipFilter" value={filterZip} onChange={(e) => handleZipChange(e)}>
                    {zipCodes.map(zip => (
                        <option key={zip} value={zip}>{zip}</option>
                    ))}
                </select>

                <button onClick={applyFilters}>Apply Filters</button>
            </div>
            <button onClick={() => setIsAddModalOpen(true)}>Add Station</button>

            <h2>Stations List</h2>
            <ul className="station-list">
                {stations.map(station => (
                    <li key={station.id} className="station-list-item" onClick={() => handleStationClick(station.id)}>
                        <span className="station-info">
                            ID: {station.id}, Name: {station.name}
                        </span>
                        <div className="station-actions">
                            <button onClick={(evt) => handleEditStation(evt, station)}>Edit</button>
                            <button onClick={(evt) => handleDeleteStation(evt, station.id)}>Delete</button>
                        </div>
                    </li>
                ))}
            </ul>

            {editingStation && (
                <StationEditModal
                    isOpen={Boolean(editingStation)}
                    onClose={() => setEditingStation(null)}
                    stationData={editingStation}
                    onSave={saveEditedStation}
                />
            )}

            <StationDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                stationData={selectedStation}
            />

            <StationAddModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddStation={handleAddStation}
                onRefresh={refreshPage}
            />
        </div>
    );
};

export default StationManagement;
