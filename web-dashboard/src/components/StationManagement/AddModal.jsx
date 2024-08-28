import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CForm,
  CFormInput,
  CFormSelect,
} from "@coreui/react";

import FormInput from "components/FormInput";
import {
  siteGetList,
  selectSiteIds,
} from "redux/site/siteSlice";
import { stationAdd } from "redux/station/stationSlice";

const StationAddModal = ({ isOpen, onClose }) => {
  const siteIds = useSelector(selectSiteIds);

  const initialFormData = {
    name: "",
    siteId: "",
    latitude: "",
    longitude: "",
  };
  const [formData, setFormData] = useState(initialFormData);
  const [validated, setValidated] = useState(false);

  const [siteOptions, setSiteOptions] = useState([]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (siteIds.length === 0) {
      dispatch(siteGetList());
    } else {
      setSiteOptions(siteIds);
    }
  }, [siteIds, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.name
      || !formData.siteId
      || !formData.latitude
      || !formData.longitude
    ) {
      setValidated(true);
      return;
    }
    dispatch(stationAdd(formData));
    handleClose();
  };

  const handleClose = () => {
    setFormData(initialFormData);
    onClose();
  };

  return (
    <CModal
      alignment="center"
      backdrop="static"
      visible={isOpen}
      onClose={handleClose}
    >
      <CModalHeader className="mb-2">
        <CModalTitle>Add New Station</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm noValidate validated={validated}>
          <FormInput
            InputForm={CFormInput}
            name="name"
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
            feedbackInvalid="Please provide station name"
            required
          />
          <FormInput
            InputForm={CFormSelect}
            name="siteId"
            options={[
              { label: "Select Site ID", value: "", disabled: true },
              ...siteOptions.map((id) => (
                { label: id, value: id }
              )),
            ]}
            value={formData.siteId}
            onChange={handleInputChange}
            feedbackInvalid="Please select a site ID"
            required
          />
          <FormInput
            InputForm={CFormInput}
            name="latitude"
            type="text"
            placeholder="Latitude"
            value={formData.latitude}
            onChange={handleInputChange}
            feedbackInvalid="Please provide station latitude"
            required
          />
          <FormInput
            InputForm={CFormInput}
            name="longitude"
            type="text"
            placeholder="Longitude"
            value={formData.longitude}
            onChange={handleInputChange}
            feedbackInvalid="Please provide station longitude"
            required
          />
          <CButton
            className="w-100"
            variant="outline"
            color="info"
            onClick={handleSubmit}
          >
            Add Station
          </CButton>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default StationAddModal;
