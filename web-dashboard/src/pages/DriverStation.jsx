import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api';
import { CChart } from '@coreui/react-chartjs';
import '../scss/StationAnalytics.scss';
import DriverStationModal from '../components/DriverStationModal';
import LocationFilter from '../components/LocationFilter';

import { stationIcon } from '../components/mapIcons';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MapContainer from '../components/MapContainer';
import DriverStationMarker from '../components/DriverStationMarker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DriverStation = () => {
    const [stations, setStations] = useState([]);
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);
    const [aggregateData, setAggregateData] = useState(null);

    const [filterState, setFilterState] = useState('All');
    const [filterCity, setFilterCity] = useState('All');
    const [filterZip, setFilterZip] = useState('94301');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [chargeLevel, setChargeLevel] = useState('All');

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

                setStates(['All', ...uniqueStates]);
                setCities(['All', ...uniqueCities]);
                setZipCodes(['All', ...uniqueZips]);
                setFilteredCities(['All', ...uniqueCities]);

                applyFilters('All', 'All', '94301');
            })
            .catch(error => console.error('Error:', error));

        fetchAggregateData();
    }, []);

    const applyFilters = (state, city, zip) => {
        let queryParams = [];
        if (zip !== 'All') {
            queryParams.push(`zip=${encodeURIComponent(zip)}`);
        } else {
            if (state !== 'All') {
                queryParams.push(`state=${encodeURIComponent(state)}`);
            }
            if (city !== 'All') {
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
        <DriverStationMarker
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
        if (chargeLevel !== 'All') queryParams.push(`charge_level=${chargeLevel}`);

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
                filterState={filterState}
                filterCity={filterCity}
                filterZip={filterZip}
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
                <DriverStationModal
                    isOpen={isAnalyticsModalOpen}
                    onClose={() => setIsAnalyticsModalOpen(false)}
                    stationId={selectedStation}
                />
            )}
        </div>
    );
};

export default DriverStation;
