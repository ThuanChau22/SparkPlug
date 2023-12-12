import React, { useState, useEffect } from 'react';
import { apiInstance } from 'redux/api';
import '../scss/SiteManagement.scss';
import SiteDetailsModal from '../components/SiteDetailsModal';
import SiteAddModal from '../components/SiteAddModal';
import SiteEditModal from '../components/SiteEditModal';

const SiteManagement = () => {
    const [sites, setSites] = useState([]);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSite, setSelectedSite] = useState(null);
    const [editingSite, setEditingSite] = useState(null);

    const siteAPI = process.env.REACT_APP_SITE_API_ENDPOINT;

    useEffect(() => {
        fetchSites();
    }, []);

    const fetchSites = () => {
        apiInstance.get(siteAPI)
            .then(response => {
                setSites(response.data);
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

    return (
        <div>
            <button onClick={() => setIsAddModalOpen(true)}>Add Site</button>

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
