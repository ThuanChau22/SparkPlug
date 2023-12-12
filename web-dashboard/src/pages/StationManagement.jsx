import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api';
import '../scss/StationManagement.scss';
import Modal from '../components/Modal';
import StationDetailsModal from '../components/StationDetailsModal';
import StationEditModal from '../components/StationEditModal';
import StationAddModal from '../components/StationAddModal';
import LocationFilter from '../components/LocationFilter';

import { stationIcon } from '../components/mapIcons';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MapContainer from '../components/MapContainer';
import StationMarker from '../components/StationMarker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [zipCodes, setZipCodes] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [message, setMessage] = useState('');

    const stationAPI = process.env.REACT_APP_STATION_API_ENDPOINT;

    useEffect(() => {
        fetchStations();
    }, []);

    const fetchStations = (queryParams = '') => {
        const url = `${stationAPI}${queryParams}`;
        apiInstance.get(url)
            .then(response => {
                const fetchedStations = response.data;
                setStations(fetchedStations);

                if (!queryParams) {
                    const uniqueStates = Array.from(new Set(fetchedStations.map(station => station.state))).sort((a, b) => a.localeCompare(b));
                    const uniqueCities = Array.from(new Set(fetchedStations.map(station => station.city))).sort((a, b) => a.localeCompare(b));
                    const uniqueZips = Array.from(new Set(fetchedStations.map(station => station.zip_code))).sort((a, b) => a.localeCompare(b));

                    setStates(['all', ...uniqueStates]);
                    setCities(['all', ...uniqueCities]);
                    setZipCodes(['all', ...uniqueZips]);
                    setFilteredCities(['all', ...uniqueCities]);
                }
            })
            .catch(error => console.error('Error:', error));
    };

    const applyFilters = (state, city, zip) => {
        let queryParams = [];
        if (zip !== 'all') {
            queryParams.push(`zip=${encodeURIComponent(zip)}`);
        } else {
            if (state !== 'all') {
                queryParams.push(`state=${encodeURIComponent(state)}`);
            }
            if (city !== 'all') {
                queryParams.push(`city=${encodeURIComponent(city)}`);
            }
        }

        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        fetchStations(queryString);
    };

    const onFiltersChange = (newState, newCity, newZip) => {
        applyFilters(newState, newCity, newZip);
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
        apiInstance.delete(`${stationAPI}/${stationId}`)
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

        apiInstance.post(stationAPI, data)
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
        apiInstance.patch(`${stationAPI}/${id}`, {
            name: name,
            price: parseFloat(price)
        }).then(() => {
            window.location.reload();
        }).catch(error => console.error('Error:', error));
    };

    const refreshPage = () => {
        window.location.reload();
    };

    const renderStationMarker = station => (
        <StationMarker
          key={station.id}
          station={station}
          icon={stationIcon}
          onMarkerClick={() => handleStationClick(station.id)}
        />
    );

    return (
        <div>
            <LocationFilter
                states={states}
                filteredCities={filteredCities}
                zipCodes={zipCodes}
                onFiltersChange={onFiltersChange}
            />
            <button onClick={() => setIsAddModalOpen(true)}>Add Station</button>

            <MapContainer locations={stations} renderMarker={renderStationMarker} />

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
