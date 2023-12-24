import { forwardRef } from "react";
import {
  CButton,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
} from "@coreui/react";

const LocationFilter = forwardRef(({
  selectedState = "All",
  states = [],
  selectedCity = "All",
  cities = [],
  selectedZipCode = "All",
  zipCodes = [],
  onChange
}, ref) => {
  const handleStateChange = (e) => {
    const newState = e.target.value;
    onChange(newState, "All", "All");
  };

  const handleCityChange = (e) => {
    const newCity = e.target.value;
    onChange(selectedState, newCity, "All");
  };

  const handleZipCodeChange = (e) => {
    const newZipCode = e.target.value;
    onChange(selectedState, selectedCity, newZipCode);
  };

  const handleClearChange = () => {
    onChange("All", "All", "All");
  };

  return (
    <div className="d-none d-lg-flex justify-content-end align-items-center" ref={ref}>
      <CInputGroup size="sm">
        <CInputGroupText className="bg-dark text-white rounded-0">
          State
        </CInputGroupText>
        <CFormSelect
          className="rounded-0 shadow-none"
          id="state"
          options={states.map(state => (
            { label: state, value: state }
          ))}
          value={selectedState}
          onChange={handleStateChange}
        />
      </CInputGroup>
      <CInputGroup size="sm">
        <CInputGroupText className="bg-dark text-white rounded-0">
          City
        </CInputGroupText>
        <CFormSelect
          className="rounded-0 shadow-none"
          options={cities.map(city => (
            { label: city, value: city }
          ))}
          value={selectedCity}
          onChange={handleCityChange}
        />
      </CInputGroup>
      <CInputGroup size="sm">
        <CInputGroupText className="bg-dark text-white rounded-0">
          Zip Code
        </CInputGroupText>
        <CFormSelect
          className="rounded-0 shadow-none"
          options={zipCodes.map(zipCode => (
            { label: zipCode, value: zipCode }
          ))}
          value={selectedZipCode}
          onChange={handleZipCodeChange}
        />
      </CInputGroup>
      <CButton
        size="sm"
        className="rounded-0 text-white"
        color="dark"
        onClick={handleClearChange}
      >
        Clear
      </CButton>
    </div>
  );
});

export default LocationFilter;
