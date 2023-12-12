// LocationFilter.jsx
import React, { useState } from 'react';

const LocationFilter = ({ states, filteredCities, zipCodes, onFiltersChange }) => {
    const [localFilterState, setLocalFilterState] = useState('all');
    const [localFilterCity, setLocalFilterCity] = useState('all');
    const [localFilterZip, setLocalFilterZip] = useState('all');

    const handleStateChange = (e) => {
        const newState = e.target.value;
        setLocalFilterState(newState);
        setLocalFilterCity('all');
        setLocalFilterZip('all');
        onFiltersChange(newState, 'all', 'all');
    };

    const handleCityChange = (e) => {
        const newCity = e.target.value;
        setLocalFilterCity(newCity);
        setLocalFilterZip('all');
        onFiltersChange(localFilterState, newCity, 'all');
    };

    const handleZipChange = (e) => {
        const newZip = e.target.value;
        setLocalFilterZip(newZip);
        setLocalFilterState('all');
        setLocalFilterCity('all');
        onFiltersChange('all', 'all', newZip);
    };

    return (
        <div className="filter-container">
            <select value={localFilterState} onChange={handleStateChange}>
                {states?.map(state => (
                    <option key={state} value={state}>{state}</option>
                ))}
            </select>
            <select value={localFilterCity} onChange={handleCityChange}>
                {filteredCities?.map(city => (
                    <option key={city} value={city}>{city}</option>
                ))}
            </select>
            <select value={localFilterZip} onChange={handleZipChange}>
                {zipCodes?.map(zip => (
                    <option key={zip} value={zip}>{zip}</option>
                ))}
            </select>
        </div>
    );
};

export default LocationFilter;
