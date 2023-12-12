import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api';
import { CChart } from '@coreui/react-chartjs';
import SiteAnalyticsModal from '../components/SiteAnalyticsModal';
import LocationFilter from '../components/LocationFilter';

import { siteIcon } from '../components/mapIcons';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MapContainer from '../components/MapContainer';
import SiteMarker from '../components/SiteMarker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const SiteAnalytics = () => {
    const [sites, setSites] = useState([]);
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
    const [selectedSite, setSelectedSite] = useState(null);

    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [zipCodes, setZipCodes] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);

    const siteAPI = process.env.REACT_APP_SITE_API_ENDPOINT;

    useEffect(() => {
        apiInstance.get(siteAPI)
            .then(response => {
                const fetchedSites = response.data;
                setSites(fetchedSites);

                const uniqueStates = Array.from(new Set(fetchedSites.map(site => site.state))).sort((a, b) => a.localeCompare(b));
                const uniqueCities = Array.from(new Set(fetchedSites.map(site => site.city))).sort((a, b) => a.localeCompare(b));
                const uniqueZips = Array.from(new Set(fetchedSites.map(site => site.zip_code))).sort((a, b) => a.localeCompare(b));

                setStates(['All', ...uniqueStates]);
                setCities(['All', ...uniqueCities]);
                setZipCodes(['All', ...uniqueZips]);
                setFilteredCities(['All', ...uniqueCities]);
            })
            .catch(error => console.error('Error:', error));
    }, []);

    const applyFilters = (state, city, zip) => {
        let query = siteAPI;
        let queryParams = [];
        if (state !== 'All') queryParams.push(`state=${state}`);
        if (city !== 'All') queryParams.push(`city=${city}`);
        if (zip !== 'All') queryParams.push(`zip=${zip}`);
        if (queryParams.length > 0) {
            query += '?' + queryParams.join('&');
        }

        apiInstance.get(query)
            .then(response => {
                setSites(response.data);
            })
            .catch(error => console.error('Error:', error));
    };

    const onFiltersChange = (newState, newCity, newZip) => {
        applyFilters(newState, newCity, newZip);
    };

    const handleSiteClick = (siteId) => {
        setSelectedSite(siteId);
        setIsAnalyticsModalOpen(true);
    };

    const renderSiteMarker = site => (
        <SiteMarker
          key={site.id}
          site={site}
          icon={siteIcon}
          onSiteClick={handleSiteClick}
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

            <MapContainer
                locations={sites}
                renderMarker={renderSiteMarker}
            />

            <h2>Sites List</h2>
            <ul className="site-list">
                {sites.map(site => (
                    <li key={site.id} className="site-list-item" onClick={() => handleSiteClick(site.id)}>
                        ID: {site.id}, Name: {site.name}
                    </li>
                ))}
            </ul>

            {isAnalyticsModalOpen && (
                <SiteAnalyticsModal
                    isOpen={isAnalyticsModalOpen}
                    onClose={() => setIsAnalyticsModalOpen(false)}
                    siteId={selectedSite}
                />
            )}
        </div>
    );
};

export default SiteAnalytics;
