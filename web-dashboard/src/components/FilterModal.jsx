import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CRow,
  CCol,
} from "@coreui/react";

import FormInput from "components/FormInput";
import FormInputAutocomplete from "components/FormInputAutocomplete";
import { siteLocationAutocomplete } from "redux/site/siteSlice";
import {
  filterDashboardStateSetAll,
  filterDashboardStateClearAll,
  selectFilterDashboardEntities,
} from "redux/filter/dashboardSlice";

const FilterModal = ({ isOpen, onClose }) => {
  const filter = useSelector(selectFilterDashboardEntities);

  const [formInput, setFormInput] = useState(filter);

  const dispatch = useDispatch();

  const isViewByInterval = () => {
    const { text, options } = formInput.viewBy;
    return text === options.interval;
  };

  const isViewByStation = () => {
    const { text, options } = formInput.viewBy;
    return text === options.station;
  };

  const handleLocationAutocomplete = async (params = {}) => {
    const locations = await dispatch(siteLocationAutocomplete({
      ...params, limit: 5,
    })).unwrap();
    return locations.map((location) => {
      const [value] = Object.values(location);
      return ({ value, label: `${value}` });
    });
  };

  const handleInputChange = ({ target }) => {
    const { name, type, value } = target;
    const changes = { ...formInput };
    changes[name].value = value;
    changes[name].text = value;
    if (value !== "" && type === "date") {
      const formatter = new Intl.DateTimeFormat();
      const date = new Date(`${value}T00:00:00`);
      changes[name].text = formatter.format(date);
    } else if (value !== "" && type === "select-one") {
      changes[name].text = changes[name].options[value];
    } else if (value !== "" && type === "number") {
      const intValue = parseInt(value);
      changes[name].value = intValue >= 1 ? intValue : 1;
      changes[name].text = changes[name].value.toString();
    }
    setFormInput(changes);
  };

  const handleSubmit = () => {
    dispatch(filterDashboardStateSetAll(formInput));
    onClose();
  };

  const handleClearAll = () => {
    dispatch(filterDashboardStateClearAll());
    onClose();
  };

  return (
    <CModal
      alignment="center"
      backdrop="static"
      visible={isOpen}
      onClose={onClose}
    >
      <CModalHeader>
        <CModalTitle>Filters</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <CRow xs={{ gutterX: 2 }}>
            <CCol sm={6}>
              <FormInput
                InputForm={CFormInput}
                className="mb-3"
                name="startDate"
                type="date"
                label={formInput.startDate.label}
                value={formInput.startDate.value}
                onChange={handleInputChange}
              />
            </CCol>
            <CCol sm={6}>
              <FormInput
                InputForm={CFormInput}
                className="mb-3"
                name="endDate"
                type="date"
                label={formInput.endDate.label}
                value={formInput.endDate.value}
                onChange={handleInputChange}
              />
            </CCol>
          </CRow>
          <CRow xs={{ gutterX: 2 }}>
            <CCol sm={6}>
              <FormInputAutocomplete
                className="mb-3"
                id="city-input-autocomplete"
                placeholder="Enter city"
                label={formInput.city.label}
                defaultInputValue={formInput.city.value}
                onSearch={(city) => handleLocationAutocomplete({ city })}
                onChange={([selected]) => handleInputChange({
                  target: {
                    name: "city",
                    type: "text",
                    value: selected?.value || "",
                  },
                })}
              />
            </CCol>
            <CCol sm={6}>
              <FormInputAutocomplete
                className="mb-3"
                id="state-input-autocomplete"
                placeholder="Enter state"
                label={formInput.state.label}
                defaultInputValue={formInput.state.value}
                onSearch={(state) => handleLocationAutocomplete({ state })}
                onChange={([selected]) => handleInputChange({
                  target: {
                    name: "state",
                    type: "text",
                    value: selected?.value || "",
                  },
                })}
              />
            </CCol>
            <CCol sm={6}>
              <FormInputAutocomplete
                className="mb-3"
                id="zip-code-input-autocomplete"
                placeholder="Enter zip code"
                label={formInput.zipCode.label}
                defaultInputValue={formInput.zipCode.value}
                onSearch={(zipCode) => handleLocationAutocomplete({ zipCode })}
                onChange={([selected]) => handleInputChange({
                  target: {
                    name: "zipCode",
                    type: "text",
                    value: selected?.value || "",
                  },
                })}
              />
            </CCol>
            <CCol sm={6}>
              <FormInputAutocomplete
                className="mb-3"
                id="country-input-autocomplete"
                placeholder="Enter country"
                label={formInput.country.label}
                defaultInputValue={formInput.country.value}
                onSearch={(country) => handleLocationAutocomplete({ country })}
                onChange={([selected]) => handleInputChange({
                  target: {
                    name: "country",
                    type: "text",
                    value: selected?.value || "",
                  },
                })}
              />
            </CCol>
          </CRow>
          <CRow xs={{ gutterX: 2 }}>
            <CCol xs={12}>
              <FormInput
                InputForm={CFormSelect}
                className="mb-3"
                name="viewBy"
                label={formInput.viewBy.label}
                value={formInput.viewBy.value}
                options={[
                  { label: "Select view", value: "", disabled: true },
                  ...Object.entries(formInput.viewBy.options)
                    .map(([value, label]) => ({ label, value })),
                ]}
                onChange={(e) => {
                  handleInputChange(e);
                  const changes = { ...formInput };
                  if (isViewByInterval()) {
                    changes.orderBy.text = "";
                    changes.orderBy.value = "";
                    changes.count.text = "";
                    changes.count.value = "";
                  }
                  if (isViewByStation()) {
                    changes.interval.text = "";
                    changes.interval.value = "";
                  }
                  setFormInput(changes);
                }}
              />
            </CCol>
            {isViewByInterval() && (
              <CCol xs={12}>
                <FormInput
                  InputForm={CFormSelect}
                  className="mb-3"
                  name="interval"
                  label={formInput.interval.label}
                  value={formInput.interval.value}
                  options={[
                    { label: "Select interval", value: "", disabled: true },
                    ...Object.entries(formInput.interval.options)
                      .map(([value, label]) => ({ label, value })),
                  ]}
                  onChange={handleInputChange}
                />
              </CCol>
            )}
            {isViewByStation() && (
              <>
                <CCol sm={6}>
                  <FormInput
                    InputForm={CFormSelect}
                    className="mb-3"
                    name="orderBy"
                    label={formInput.orderBy.label}
                    value={formInput.orderBy.value}
                    options={[
                      { label: "Select order", value: "", disabled: true },
                      ...Object.entries(formInput.orderBy.options)
                        .map(([value, label]) => ({ label, value })),
                    ]}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol sm={6}>
                  <FormInput
                    InputForm={CFormInput}
                    className="mb-3"
                    name="count"
                    type="number"
                    min="1"
                    placeholder="Enter count"
                    label={formInput.count.label}
                    value={formInput.count.value}
                    onChange={handleInputChange}
                  />
                </CCol>
              </>
            )}
          </CRow>
          <CButton
            variant="outline"
            color="info"
            onClick={handleSubmit}
          >
            Apply
          </CButton>
          <CButton
            className="ms-2"
            variant="outline"
            color="secondary"
            onClick={onClose}
          >
            Cancel
          </CButton>
          <CButton
            className="float-end"
            variant="outline"
            color="warning"
            onClick={handleClearAll}
          >
            Clear All
          </CButton>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default FilterModal;
