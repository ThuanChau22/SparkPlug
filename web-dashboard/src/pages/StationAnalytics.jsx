import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api';
import { CChart } from '@coreui/react-chartjs';
import '../scss/StationAnalytics.scss';
import StationAnalyticsModal from '../components/StationAnalyticsModal';
import LocationFilter from '../components/LocationFilter';

import { stationIcon } from '../components/mapIcons';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MapContainer from '../components/MapContainer';
import StationMarker from '../components/StationMarker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const StationAnalytics = () => {
    const [stations, setStations] = useState([]);
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);
    const [aggregateData, setAggregateData] = useState(null);

    const [filterState, setFilterState] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [filterZip, setFilterZip] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [chargeLevel, setChargeLevel] = useState('all');

    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [zipCodes, setZipCodes] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);

    const stationAPI = process.env.REACT_APP_STATION_API_ENDPOINT;
    const stationAnalyticsAPI = process.env.REACT_APP_STATION_ANALYTICS_API_ENDPOINT;

    useEffect(() => {
        apiInstance.get(stationAPI)
            .then(response => {
                const fetchedStations = response.data;
                setStations(fetchedStations);

                const uniqueStates = Array.from(new Set(fetchedStations.map(station => station.state))).sort((a, b) => a.localeCompare(b));
                const uniqueCities = Array.from(new Set(fetchedStations.map(station => station.city))).sort((a, b) => a.localeCompare(b));
                const uniqueZips = Array.from(new Set(fetchedStations.map(station => station.zip_code))).sort((a, b) => a.localeCompare(b));

                setStates(['all', ...uniqueStates]);
                setCities(['all', ...uniqueCities]);
                setZipCodes(['all', ...uniqueZips]);
                setFilteredCities(['all', ...uniqueCities]);
            })
            .catch(error => console.error('Error:', error));

        fetchAggregateData();
    }, []);

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
        apiInstance.get(`${stationAPI}${queryString}`)
            .then(response => {
                setStations(response.data);
            })
            .catch(error => console.error('Error:', error));
    };

    const onFiltersChange = (newState, newCity, newZip) => {
        setFilterState(newState);
        setFilterCity(newCity);
        setFilterZip(newZip);
        applyFilters(newState, newCity, newZip);
    };

    const handleStationClick = (stationId) => {
        setSelectedStation(stationId);
        setIsAnalyticsModalOpen(true);
    };

    const renderStationMarker = station => (
        <StationMarker
          key={station.id}
          station={station}
          icon={stationIcon}
          onMarkerClick={() => handleStationClick(station.id)}
        />
    );

    const fetchAggregateData = () => {
        let queryParams = [];
        if (startDate) queryParams.push(`start_date=${startDate}`);
        if (endDate) queryParams.push(`end_date=${endDate}`);
        if (chargeLevel !== 'all') queryParams.push(`charge_level=${chargeLevel}`);

        let query = `${stationAnalyticsAPI}?${queryParams.join('&')}`;
        apiInstance.get(query)
            .then(response => {
                setAggregateData(response.data);
            })
            .catch(error => console.error('Error:', error));
    };

    return (
        <div>
            <LocationFilter
                states={states}
                filteredCities={filteredCities}
                zipCodes={zipCodes}
                onFiltersChange={onFiltersChange}
            />

            <MapContainer locations={stations} renderMarker={renderStationMarker} />

            <h2>Stations List</h2>
            <ul className="station-list">
                {stations.map(station => (
                    <li key={station.id} className="station-list-item" onClick={() => handleStationClick(station.id)}>
                        ID: {station.id}, Name: {station.name}
                    </li>
                ))}
            </ul>

            {isAnalyticsModalOpen && (
                <StationAnalyticsModal
                    isOpen={isAnalyticsModalOpen}
                    onClose={() => setIsAnalyticsModalOpen(false)}
                    stationId={selectedStation}
                />
            )}

            <div className="station-analytics-container">
                <div className="analytics-filters">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    <select value={chargeLevel} onChange={(e) => setChargeLevel(e.target.value)}>
                        <option value="all">All Levels</option>
                        <option value="1">Level 1</option>
                        <option value="2">Level 2</option>
                        <option value="3">Level 3</option>
                    </select>
                    <button onClick={fetchAggregateData}>Update</button>
                </div>
                <div className="charts-container">
                    {aggregateData && (
                        <>
                            <CChart type="line" data={aggregateData.revenue} options={{ /* chart options here */ }} />
                            <CChart type="bar" data={aggregateData.peak_time} options={{ /* chart options here */ }} />
                            <CChart type="line" data={aggregateData.utilization_rate} options={{ /* chart options here */ }} />
                            <CChart type="bar" data={aggregateData.sessions_count} options={{ /* chart options here */ }} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StationAnalytics;
