import React, { useState, useEffect } from 'react';

const LocationFilter = ({ states, filteredCities, zipCodes, onFiltersChange, filterState, filterCity, filterZip }) => {
    const [localFilterState, setLocalFilterState] = useState(filterState);
    const [localFilterCity, setLocalFilterCity] = useState(filterCity);
    const [localFilterZip, setLocalFilterZip] = useState(filterZip);

    useEffect(() => {
        setLocalFilterState(filterState);
        setLocalFilterCity(filterCity);
        setLocalFilterZip(filterZip);
    }, [filterState, filterCity, filterZip]);

    const handleStateChange = (e) => {
        const newState = e.target.value;
        setLocalFilterState(newState);
        setLocalFilterCity('All');
        setLocalFilterZip('All');
        onFiltersChange(newState, 'All', 'All');
    };

    const handleCityChange = (e) => {
        const newCity = e.target.value;
        setLocalFilterCity(newCity);
        setLocalFilterZip('All');
        onFiltersChange(localFilterState, newCity, 'All');
    };

    const handleZipChange = (e) => {
        const newZip = e.target.value;
        setLocalFilterZip(newZip);
        setLocalFilterState('All');
        setLocalFilterCity('All');
        onFiltersChange('All', 'All', newZip);
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
