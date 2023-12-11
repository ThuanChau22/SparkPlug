import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api';
import '../scss/SiteManagement.scss';
import Modal from '../components/Modal';
import SiteDetailsModal from '../components/SiteDetailsModal';

const SiteManagement = () => {
    const [sites, setSites] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSite, setSelectedSite] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [newSiteData, setNewSiteData] = useState({
        name: '',
        owner_id: '',
        street_address: '',
        zip_code: '',
        latitude: '',
        longitude: '',
    });
    const [filterState, setFilterState] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [filterZip, setFilterZip] = useState('all');
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [zipCodes, setZipCodes] = useState([]);
    const [message, setMessage] = useState('');
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

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
        const site = sites.find(s => s.id === siteId);
        setSelectedSite(site);
        setIsDetailsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewSiteData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSite = () => {
        apiInstance.post('http://127.0.0.1:5000/api/sites', newSiteData)
            .then(response => {
                setMessage('Site added successfully');
                setIsModalOpen(false);
            })
            .catch(error => {
                setMessage('Error adding site');
                setIsModalOpen(false);
            });
    };

    const applyFilters = () => {
        let queryParams = '';
        if (filterState !== 'all') queryParams += `state=${filterState}&`;
        if (filterCity !== 'all') queryParams += `city=${filterCity}&`;
        if (filterZip !== 'all') queryParams += `zip=${filterZip}&`;

        apiInstance.get(`http://127.0.0.1:5000/api/sites?${queryParams}`)
            .then(response => {
                setSites(response.data);
            })
            .catch(error => console.error('Error:', error));
    };

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
            <button onClick={() => setIsModalOpen(true)}>Add Site</button>

            <h2>Sites List</h2>
            <ul className="site-list">
                {sites.map(site => (
                    <li key={site.id} className="site-list-item" onClick={() => handleSiteClick(site.id)}>
                        ID: {site.id}, Name: {site.name}
                    </li>
                ))}
            </ul>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {/* Form for adding a site */}
                {/* ... */}
            </Modal>

            <SiteDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                siteData={selectedSite}
            />

            <Modal 
                isOpen={isMessageModalOpen} 
                onClose={() => setMessage('')}
                className="message-modal-content"
            >
                <p>{message}</p>
            </Modal>
        </div>
    );
};

export default SiteManagement;
