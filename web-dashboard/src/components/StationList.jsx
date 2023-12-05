import React, { useState, useEffect } from 'react';

const StationList = ({ onSelectStation }) => {
    const [stations, setStations] = useState([]);

    useEffect(() => {
        // Replace with the actual API endpoint to fetch stations
        fetch('/api/stations/owned')
            .then(response => response.json())
            .then(data => setStations(data))
            .catch(error => console.error('Error:', error));
    }, []);

    return (
        <div>
            <h2>Your Stations</h2>
            <ul>
                {stations.map(station => (
                    <li key={station.id} onClick={() => onSelectStation(station.id)}>
                        {station.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StationList;
