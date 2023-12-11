import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api';
import { CChart } from '@coreui/react-chartjs';
import '../scss/SiteManagement.scss';
import SiteAnalyticsModal from '../components/SiteAnalyticsModal';

const SiteAnalytics = () => {
    const [sites, setSites] = useState([]);
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
    const [selectedSite, setSelectedSite] = useState(null);
    const [aggregateData, setAggregateData] = useState(null);


    const [filterState, setFilterState] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [filterZip, setFilterZip] = useState('all');

    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [zipCodes, setZipCodes] = useState([]);

    const [analyticsData, setAnalyticsData] = useState(null);

    useEffect(() => {
        apiInstance.get('http://127.0.0.1:5000/api/sites')
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
    }, []);

    const handleSiteClick = (siteId) => {
        setSelectedSite(siteId);
        setIsAnalyticsModalOpen(true);
    };

    const applyFilters = () => {
        //let query = process.env.REACT_APP_
        let query = 'http://127.0.0.1:5000/api/sites';
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

            {/* Sites List */}
            <h2>Sites List</h2>
            <ul className="site-list">
                {sites.map(site => (
                    <li key={site.id} className="site-list-item" onClick={() => handleSiteClick(site.id)}>
                        ID: {site.id}, Name: {site.name}
                    </li>
                ))}
            </ul>

            {/* site Analytics Modal for individual site details */}
            <SiteAnalyticsModal
                isOpen={isAnalyticsModalOpen}
                onClose={() => setIsAnalyticsModalOpen(false)}
                siteId={selectedSite}
            />
        </div>
    );
};

export default SiteAnalytics;
