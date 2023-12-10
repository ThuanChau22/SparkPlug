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

    const handleCloseModal = () => {
        setIsModalOpen(false);
        window.location.reload(); // Reload page when modal is closed
    };

    const handleCloseMessageModal = () => {
        setIsMessageModalOpen(false);
        window.location.reload(); // Reload page when message modal is closed
    };

    // Add other handlers and functions as needed

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
            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                {/* ... Form for adding a site */}
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
