import { useState } from "react";
import {
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
  CModal,
  CModalHeader,
  CModalBody,
} from "@coreui/react";

import FormInput from "components/FormInput";

const FilterModal = ({ filter = {}, isOpen, onSubmit, onClose }) => {
  const [formData, setFormData] = useState(filter);

  // const dispatch = useDispatch();

  // const fetchLocations = useCallback(async ({
  //   city, state, limit,
  //   zipCode: zip_code,
  // }) => {
  //   try {
  //     const endpoint = `${SiteAPI}/locations`;
  //     const params = Object.entries({
  //       city, state, zip_code, limit,
  //     }).map(([key, value]) => value ? `${key}=${value}` : "")
  //       .filter((param) => param).join("&");
  //     const query = `${endpoint}${params ? `?${params}` : ""}`;
  //     const headers = { Authorization: `Bearer ${token}` };
  //     const { data } = await apiInstance.get(query, { headers });
  //     console.log({ data });

  //     // setCityOptions(data.map((value) => ({ label: value, value })));
  //     return data.map((value) => ({ label: value, value }));
  //   } catch (error) {
  //     handleError(error, dispatch)
  //   }
  // }, [SiteAPI, token, dispatch]);

  const handleInputChange = ({ target }) => {
    const { name, value } = target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <CModal
      alignment="center"
      backdrop="static"
      visible={isOpen}
      onClose={onClose}
    >
      <CModalHeader></CModalHeader>
      <CModalBody>
        <CForm>
          <FormInput
            InputForm={CFormInput}
            label="From"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleInputChange}
          />
          <FormInput
            InputForm={CFormInput}
            label="To"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleInputChange}
          />
          <FormInput
            InputForm={CFormInput}
            label="City"
            name="city"
            type="text"
            placeholder="Enter city"
            value={formData.city}
            onChange={handleInputChange}
          />
          <FormInput
            InputForm={CFormInput}
            label="State"
            name="state"
            type="text"
            placeholder="Enter state"
            value={formData.state}
            onChange={handleInputChange}
          />
          <FormInput
            InputForm={CFormInput}
            label="Zip Code"
            name="zipCode"
            type="text"
            placeholder="Enter zip code"
            value={formData.zipCode}
            onChange={handleInputChange}
          />
          <FormInput
            InputForm={CFormInput}
            label="Country"
            name="country"
            type="text"
            placeholder="Enter country"
            value={formData.country}
            onChange={handleInputChange}
          />
          <FormInput
            InputForm={CFormSelect}
            label="View By"
            name="viewBy"
            options={[
              { label: "Select View By", value: "", disabled: true },
              { label: "Time interval", value: "interval" },
              { label: "Station", value: "station" },
            ]}
            placeholder="Select view"
            value={formData.viewBy}
            onChange={handleInputChange}
          />
          <FormInput
            InputForm={CFormSelect}
            label="Order By"
            name="order"
            options={[
              { label: "Select View Order", value: "", disabled: true },
              { label: "Descending", value: "desc" },
              { label: "Ascending", value: "asc" },
            ]}
            placeholder="Select order"
            value={formData.order}
            onChange={handleInputChange}
          />
          <FormInput
            InputForm={CFormInput}
            label="Count"
            name="count"
            type="number"
            min="1"
            placeholder="Enter count"
            value={formData.count}
            onChange={handleInputChange}
          />
          <FormInput
            InputForm={CFormSelect}
            label="View Interval"
            name="order"
            options={[
              { label: "Select View Interval", value: "", disabled: true },
              { label: "Days", value: "days" },
              { label: "Months", value: "months" },
              { label: "Years", value: "years" },
            ]}
            placeholder="Select order"
            value={formData.order}
            onChange={handleInputChange}
          />
          <div className="text-center">
            <CButton
              className="w-100"
              variant="outline"
              color="info"
              onClick={handleSubmit}
            >
              Apply
            </CButton>
          </div>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default FilterModal;
