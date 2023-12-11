import React, { useEffect, useState } from 'react';
import { CChart } from '@coreui/react-chartjs';
import { apiInstance } from 'redux/api';
import '../scss/StationAnalyticsModal.scss';

const StationAnalyticsModal = ({ isOpen, onClose, stationId }) => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [chargeLevel, setChargeLevel] = useState('all');

    useEffect(() => {
        fetchData();
    }, [stationId]);

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

    const fetchData = () => {
        if (stationId) {
            let query = `http://127.0.0.1:5000/api/stations/analytics/${stationId}`;
            let queryParams = [];
            if (startDate) queryParams.push(`start_date=${formatDate(startDate)}`);
            if (endDate) queryParams.push(`end_date=${formatDate(endDate)}`);
            if (chargeLevel !== 'all') queryParams.push(`charge_level=${chargeLevel}`);
            if (queryParams.length > 0) query += '?' + queryParams.join('&');

            apiInstance.get(query)
                .then(response => {
                    setAnalyticsData(response.data);
                })
                .catch(error => console.error('Error:', error));
        }
    };

    if (!isOpen || !analyticsData) {
        return null;
    }

    const { peak_time, revenue, utilization_rate, sessions_count } = analyticsData;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="analytics-filters">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    <select value={chargeLevel} onChange={(e) => setChargeLevel(e.target.value)}>
                        <option value="all">All Levels</option>
                        <option value="1">Level 1</option>
                        <option value="2">Level 2</option>
                        <option value="3">Level 3</option>
                    </select>
                    <button onClick={fetchData}>Update</button>
                </div>
                <CChart type="line" data={revenue} options={{ /* chart options here */ }} />
                <CChart type="bar" data={peak_time} options={{ /* chart options here */ }} />
                <CChart type="line" data={utilization_rate} options={{ /* chart options here */ }} />
                <CChart type="bar" data={sessions_count} options={{ /* chart options here */ }} />
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default StationAnalyticsModal;
