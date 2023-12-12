import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api';
import '../scss/SiteManagement.scss';
import SiteDetailsModal from '../components/SiteDetailsModal';
import SiteAddModal from '../components/SiteAddModal';
import SiteEditModal from '../components/SiteEditModal';

import { siteIcon } from '../components/mapIcons';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MapContainer from '../components/MapContainer';
import SiteMarker from '../components/SiteMarker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import LocationFilter from '../components/LocationFilter';

const SiteManagement = () => {
    const [sites, setSites] = useState([]);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSite, setSelectedSite] = useState(null);
    const [editingSite, setEditingSite] = useState(null);

    const [filterState, setFilterState] = useState('All');
    const [filterCity, setFilterCity] = useState('All');
    const [filterZip, setFilterZip] = useState('All');
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [zipCodes, setZipCodes] = useState([]);

    const [filteredCities, setFilteredCities] = useState([]);


    const siteAPI = process.env.REACT_APP_SITE_API_ENDPOINT;

    useEffect(() => {
        fetchSites();
    }, []);

    useEffect(() => {
        if (filterState !== 'All') {
            const citiesInState = Array.from(new Set(sites
                .filter(site => site.state === filterState)
                .map(site => site.city)))
                .sort((a, b) => a.localeCompare(b));
            setFilteredCities(['All', ...citiesInState]);
        } else {
            setFilteredCities(['All', ...Array.from(new Set(sites.map(site => site.city))).sort((a, b) => a.localeCompare(b))]);
        }
    }, [filterState, sites]);

    useEffect(() => {
        applyFilters(filterState, filterCity, filterZip);
    }, [filterState, filterCity, filterZip]);


    const fetchSites = () => {
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
            })
            .catch(error => console.error('Error:', error));
    };




    const handleSiteClick = (siteId) => {
        const site = sites.find(s => s.id === siteId);
        setSelectedSite(site);
        setIsDetailsModalOpen(true);
    };

    const handleAddSite = (siteData) => {
        apiInstance.post(siteAPI, siteData)
            .then(() => {
                fetchSites();
            })
            .catch(error => console.error('Error:', error));
        fetchSites();
    };

    const handleEditSite = (evt, site) => {
        evt.stopPropagation();
        setEditingSite(site);
        setIsDetailsModalOpen(false);
        fetchSites();
    };

    const saveEditedSite = (id, name) => {
        apiInstance.patch(`${siteAPI}/${id}`, {
            name: name,
        }).then(() => {
            window.location.reload();;
        }).catch(error => console.error('Error:', error));
    };

    const handleDeleteSite = (evt, siteId) => {
        evt.stopPropagation();
        apiInstance.delete(`${siteAPI}/${siteId}`)
            .then(() => {
                fetchSites();
            })
            .catch(error => console.error('Error:', error));
    };

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
        setFilterState(newState);
        setFilterCity(newCity);
        setFilterZip(newZip);
        applyFilters(newState, newCity, newZip);
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
            <button onClick={() => setIsAddModalOpen(true)}>Add Site</button>

            <MapContainer
                locations={sites}
                renderMarker={renderSiteMarker}
            />

            <h2>Sites List</h2>
            <ul className="site-list">
                {sites.map(site => (
                    <li key={site.id} className="site-list-item" onClick={() => handleSiteClick(site.id)}>
                        <span className="site-info">
                            ID: {site.id}, Name: {site.name}
                        </span>
                        <div className="site-actions">
                            <button onClick={(evt) => handleEditSite(evt, site)}>Edit</button>
                            <button onClick={(evt) => handleDeleteSite(evt, site.id)}>Delete</button>
                        </div>
                    </li>
                ))}
            </ul>

            <SiteDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                siteData={selectedSite}
            />

            <SiteAddModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddSite={handleAddSite}
            />

            {editingSite && (
                <SiteEditModal
                    isOpen={Boolean(editingSite)}
                    onClose={() => setEditingSite(null)}
                    siteData={editingSite}
                    onSave={saveEditedSite}
                />
            )}
        </div>
    );
};

export default SiteManagement;
