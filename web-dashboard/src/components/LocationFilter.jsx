// LocationFilter.jsx
import React from 'react';

const LocationFilter = ({ states, filteredCities, zipCodes, filterState, filterCity, filterZip, onStateChange, onCityChange, onZipChange }) => {
    const handleZipChange = (e) => {
        if (e.target.value !== 'all') {
            onStateChange({ target: { value: 'all' } });
            onCityChange({ target: { value: 'all' } });
        }
        onZipChange(e);
    };

    const handleStateOrCityChange = (e, changeHandler) => {
        if (filterZip !== 'all') {
            onZipChange({ target: { value: 'all' } });
        }
        changeHandler(e);
    };

    return (
        <div className="filter-container">
            <select value={filterState} onChange={(e) => { onStateChange(e); }}>
                {states?.map(state => (
                    <option key={state} value={state}>{state}</option>
                ))}
            </select>
            <select value={filterCity} onChange={(e) => { onCityChange(e); }}>
                {filteredCities?.map(city => (
                    <option key={city} value={city}>{city}</option>
                ))}
            </select>
            <select value={filterZip} onChange={(e) => { onZipChange(e); }}>
                {zipCodes?.map(zip => (
                    <option key={zip} value={zip}>{zip}</option>
                ))}
            </select>
        </div>
    );
};

export default LocationFilter;
