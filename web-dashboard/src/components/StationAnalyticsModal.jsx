import React, { useEffect, useState } from 'react';
import { CChart } from '@coreui/react-chartjs';
import { apiInstance } from 'redux/api';
import '../scss/StationAnalyticsModal.scss'

const StationAnalyticsModal = ({ isOpen, onClose, stationId }) => {
    const [analyticsData, setAnalyticsData] = useState(null);

    useEffect(() => {
        // Fetch data using your Axios instance
        if (stationId) {
            apiInstance.get(`http://127.0.0.1:5000/api/stations/analytics/${stationId}`)
                .then(response => {
                    setAnalyticsData(response.data);
                })
                .catch(error => console.error('Error:', error));
        }
    }, [stationId]);

    if (!isOpen || !analyticsData) {
        return null;
    }

    const { peak_time, revenue, utilization_rate, sessions_count } = analyticsData;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <CChart
                    type="bar"
                    data={peak_time}
                    options={{ /* chart options here */ }}
                />
                <CChart
                    type="line"
                    data={revenue}
                    options={{ /* chart options here */ }}
                />
                <CChart
                    type="line"
                    data={utilization_rate}
                    options={{ /* chart options here */ }}
                />
                <CChart
                    type="bar"
                    data={sessions_count}
                    options={{ /* chart options here */ }}
                />
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default StationAnalyticsModal;