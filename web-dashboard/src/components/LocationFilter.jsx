import { useState } from 'react';
import {
  CFormSelect,
} from '@coreui/react';

const LocationFilter = ({ states, filteredCities, zipCodes, onFiltersChange }) => {
  const [localFilterState, setLocalFilterState] = useState('All');
  const [localFilterCity, setLocalFilterCity] = useState('All');
  const [localFilterZip, setLocalFilterZip] = useState('All');

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
    <div
      // className="filter-container"
      className="d-flex justify-content-end align-items-center gap-2"
    >
      <CFormSelect
        className="shadow-none"
        options={states?.map(state => (
          { label: state, value: state }
        ))}
        value={localFilterState}
        onChange={handleStateChange}
      />
      <CFormSelect
        className="shadow-none"
        options={filteredCities?.map(city => (
          { label: city, value: city }
        ))}
        value={localFilterCity}
        onChange={handleCityChange}
      />
      <CFormSelect
        className="shadow-none"
        options={zipCodes?.map(zip => (
          { label: zip, value: zip }
        ))}
        value={localFilterZip}
        onChange={handleZipChange}
      />
    </div>
  );
};

export default LocationFilter;

