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

const SiteManagement = () => {
    const [sites, setSites] = useState([]);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSite, setSelectedSite] = useState(null);
    const [editingSite, setEditingSite] = useState(null);

    const [filterState, setFilterState] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [filterZip, setFilterZip] = useState('all');
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [zipCodes, setZipCodes] = useState([]);


    const siteAPI = process.env.REACT_APP_SITE_API_ENDPOINT;

    useEffect(() => {
        fetchSites();
    }, []);

    const fetchSites = () => {
        apiInstance.get(siteAPI)
            .then(response => {
                const fetchedSites = response.data;
                setSites(fetchedSites);

                const uniqueStates = [...new Set(fetchedSites.map(site => site.state))];
                const uniqueCities = [...new Set(fetchedSites.map(site => site.city))];
                const uniqueZips = [...new Set(fetchedSites.map(site => site.zip_code))];

                setStates(['all', ...uniqueStates]);
                setCities(['all', ...uniqueCities]);
                setZipCodes(['all', ...uniqueZips]);
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

    const applyFilters = () => {
        let query = siteAPI;
        let queryParams = [];
        if (filterState !== 'all') queryParams.push(`state=${filterState}`);
        if (filterCity !== 'all') queryParams.push(`city=${filterCity}`);
        if (filterZip !== 'all') queryParams.push(`zip=${filterZip}`);
        if (queryParams.length > 0) {
            query += '?' + queryParams.join('&');
        }

        apiInstance.get(query)
            .then(response => {
                setSites(response.data);
            })
            .catch(error => console.error('Error:', error));
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
