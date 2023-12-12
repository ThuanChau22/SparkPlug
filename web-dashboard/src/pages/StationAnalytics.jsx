import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api';
import { CChart } from '@coreui/react-chartjs';
import '../scss/StationAnalytics.scss';
import StationAnalyticsModal from '../components/StationAnalyticsModal';

import { stationIcon } from '../components/mapIcons';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MapContainer from '../components/MapContainer';
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

    const [analyticsData, setAnalyticsData] = useState(null);

    const stationAPI = process.env.REACT_APP_STATION_API_ENDPOINT;
    const stationAnalyticsAPI = process.env.REACT_APP_STATION_ANALYTICS_API_ENDPOINT;

    useEffect(() => {
        apiInstance.get(stationAPI)
            .then(response => {
                const fetchedStations = response.data;
                setStations(fetchedStations);

                const uniqueStates = [...new Set(fetchedStations.map(station => station.state))];
                const uniqueCities = [...new Set(fetchedStations.map(station => station.city))];
                const uniqueZips = [...new Set(fetchedStations.map(station => station.zip_code))];

                setStates(['all', ...uniqueStates]);
                setCities(['all', ...uniqueCities]);
                setZipCodes(['all', ...uniqueZips]);
            })
            .catch(error => console.error('Error:', error));

        fetchAggregateData();
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        let month = '' + (date.getMonth() + 1);
        let day = '' + date.getDate();
        const year = date.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [month, day, year].join('/');
    };

    const fetchAggregateData = () => {
        // Construct query parameters based on filters
        let queryParams = [];
        if (startDate) queryParams.push(`start_date=${formatDate(startDate)}`);
        if (endDate) queryParams.push(`end_date=${formatDate(endDate)}`);
        if (chargeLevel !== 'all') queryParams.push(`charge_level=${chargeLevel}`);
        let query = stationAnalyticsAPI;
        if (queryParams.length > 0) query += '?' + queryParams.join('&');

        apiInstance.get(query)
            .then(response => {
                setAggregateData(response.data); // Set the aggregateData state with the response
            })
            .catch(error => console.error('Error:', error));
    };

    const updateAnalyticsData = () => {
        // Trigger useEffect to refetch data
        setAnalyticsData(null); // Clear existing data
        // useEffect will automatically be called since dependencies have changed
    };

    const handleStationClick = (stationId) => {
        setSelectedStation(stationId);
        setIsAnalyticsModalOpen(true);
    };

    const applyFilters = () => {
        //let query = process.env.REACT_APP_
        let query = stationAPI;
        let queryParams = [];
        if (filterState !== 'all') queryParams.push(`state=${filterState}`);
        if (filterCity !== 'all') queryParams.push(`city=${filterCity}`);
        if (filterZip !== 'all') queryParams.push(`zip=${filterZip}`);
        if (queryParams.length > 0) {
            query += '?' + queryParams.join('&');
        }

        apiInstance.get(query)
            .then(response => {
                setStations(response.data);
            })
            .catch(error => console.error('Error:', error));
    };

    return (
        <div>
            {/* Filter container for aggregate data */}
            <div className="filter-container">
                <select value={filterState} onChange={(e) => setFilterState(e.target.value)}>
                    {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>
                <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
                    {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
                <select value={filterZip} onChange={(e) => setFilterZip(e.target.value)}>
                    {zipCodes.map(zip => (
                        <option key={zip} value={zip}>{zip}</option>
                    ))}
                </select>
                <button onClick={applyFilters}>Apply Filters</button>
            </div>

            <MapContainer locations={stations} icon={stationIcon} />

            {/* Stations List */}
            <h2>Stations List</h2>
            <ul className="station-list">
                {stations.map(station => (
                    <li key={station.id} className="station-list-item" onClick={() => handleStationClick(station.id)}>
                        ID: {station.id}, Name: {station.name}
                    </li>
                ))}
            </ul>

            {/* Station Analytics Modal for individual station details */}
            <StationAnalyticsModal
                isOpen={isAnalyticsModalOpen}
                onClose={() => setIsAnalyticsModalOpen(false)}
                stationId={selectedStation}
            />

            {/* Container for aggregate analytics charts and filters */}
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
