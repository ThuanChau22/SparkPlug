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
    const [message, setMessage] = useState('');
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

    useEffect(() => {
        apiInstance.get('http://127.0.0.1:5000/api/sites')
            .then(response => {
                setSites(response.data);
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
        apiInstance.post('http://127.0.0.1:5000/api/sites', newSiteData, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            setMessage('Site added successfully');
            setIsModalOpen(false);
            setIsMessageModalOpen(true);
            setNewSiteData({
                name: '',
                owner_id: '',
                street_address: '',
                zip_code: '',
                latitude: '',
                longitude: '',
            });
        }).catch(error => {
            console.error('Error:', error);
            setMessage('Error adding site');
            setIsModalOpen(false);
            setIsMessageModalOpen(true);
        });
    };

    const handleCloseMessageModal = () => {
        setIsMessageModalOpen(false);
        window.location.reload(); // Reload the page to reflect new changes
    };

    return (
        <div>
            <button onClick={() => setIsModalOpen(true)}>Add Site</button>

            {/* Sites List */}
            <h2>Sites List</h2>
            <ul className="site-list">
                {sites.map(site => (
                    <li key={site.id} className="site-list-item" onClick={() => handleSiteClick(site.id)}>
                        ID: {site.id}, Name: {site.name}
                    </li>
                ))}
            </ul>

            {/* Add Site Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {/* Form for adding a site */}
                {/* ... */}
            </Modal>

            {/* Site Details Modal */}
            <SiteDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                siteData={selectedSite}
                // Add onDelete or other functions if needed
            />

            {/* Message Modal */}
            <Modal 
                isOpen={isMessageModalOpen} 
                onClose={handleCloseMessageModal}
                className="message-modal-content"
            >
                <p>{message}</p>
            </Modal>
        </div>
    );
};

export default SiteManagement;
