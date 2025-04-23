import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CForm,
  CFormInput,
} from "@coreui/react";

import FormInput from "components/FormInput";
import useMapZoom from "hooks/useMapZoom";
import { stationAdd } from "redux/station/stationSlice";
import utils from "utils";

const StationAddModal = ({ isOpen, onClose }) => {
  const initialFormData = useMemo(() => ({
    name: "",
    siteId: "",
    latitude: "",
    longitude: "",
  }), []);

  const [formData, setFormData] = useState(initialFormData);
  const [validated, setValidated] = useState(false);

  const [mapZoom, setMapZoom] = useMapZoom();

  const dispatch = useDispatch();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.name
      || !formData.siteId
      || !formData.latitude
      || !formData.longitude
    ) {
      setValidated(true);
      return;
    }
    const station = await dispatch(stationAdd(formData)).unwrap();
    if (station) {
      const { latitude: lat, longitude: lng } = station;
      setMapZoom({ lat, lng });
    }
  };

  const handleClose = useCallback(() => {
    setFormData(initialFormData);
    onClose();
  }, [initialFormData, onClose]);

  useEffect(() => {
    const { lat, lng } = mapZoom;
    if (utils.hasLatLngValue({ lat, lng })) {
      handleClose();
    }
  }, [mapZoom, handleClose]);

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
            name="siteId"
            type="text"
            placeholder="Site ID"
            value={formData.siteId}
            onChange={handleInputChange}
            feedbackInvalid="Please select a site ID"
            required
          />
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
