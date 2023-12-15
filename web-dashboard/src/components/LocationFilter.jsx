import {
  CButton,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
} from "@coreui/react";

const LocationFilter = ({
  selectedState = "All",
  states = [],
  selectedCity = "All",
  cities = [],
  selectedZipCode = "All",
  zipCodes = [],
  onChange
}) => {
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
    <div className="d-flex justify-content-end align-items-center">
      <CInputGroup>
        <CInputGroupText className="bg-secondary text-white rounded-0">
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
      <CInputGroup>
        <CInputGroupText className="bg-secondary text-white rounded-0">
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
      <CInputGroup>
        <CInputGroupText className="bg-secondary text-white rounded-0">
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
        className="rounded-0 text-white"
        color="secondary"
        onClick={handleClearChange}
      >
        Clear
      </CButton>
    </div>
  );
};

export default LocationFilter;
