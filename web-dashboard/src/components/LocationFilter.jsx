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

  const FilterFormSelectGroup = ({
    id,
    options,
    value,
    onChange,
    children,
  }) => (
    <CInputGroup>
      <CInputGroupText className="border-0 rounded-0">
        {children}
      </CInputGroupText>
      <CFormSelect
        className="border-0 rounded-0 shadow-none"
        id={id}
        options={options}
        value={value}
        onChange={onChange}
      />
    </CInputGroup>
  );

  return (
    <div
      className="d-none d-lg-flex justify-content-end align-items-center"
      style={{ backgroundColor: "var(--cui-body-bg)" }}
      ref={ref}
    >
      <FilterFormSelectGroup
        id="state"
        options={states.map(state => (
          { label: state, value: state }
        ))}
        value={selectedState}
        onChange={handleStateChange}
      >
        State
      </FilterFormSelectGroup>
      <FilterFormSelectGroup
        id="city"
        options={cities.map(city => (
          { label: city, value: city }
        ))}
        value={selectedCity}
        onChange={handleCityChange}
      >
        City
      </FilterFormSelectGroup>
      <FilterFormSelectGroup
        id="zipCode"
        options={zipCodes.map(zipCode => (
          { label: zipCode, value: zipCode }
        ))}
        value={selectedZipCode}
        onChange={handleZipCodeChange}
      >
        Zip Code
      </FilterFormSelectGroup>
      <CButton
        className="border-0 rounded-0"
        variant="outline"
        color="info"
        onClick={handleClearChange}
      >
        Clear
      </CButton>
    </div>
  );
});

export default LocationFilter;
