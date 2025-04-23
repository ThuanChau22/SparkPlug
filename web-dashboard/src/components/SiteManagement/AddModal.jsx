import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import {
  selectAuthUserId,
  selectAuthRoleIsStaff,
  selectAuthRoleIsOwner,
} from "redux/auth/authSlice";
import useMapZoom from "hooks/useMapZoom";
import { siteAdd } from "redux/site/siteSlice";
import utils from "utils";

const SiteAddModal = ({ isOpen, onClose }) => {
  const authUserId = useSelector(selectAuthUserId);
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const authIsOwner = useSelector(selectAuthRoleIsOwner);

  const initialFormData = useMemo(() => ({
    name: "",
    ownerId: "",
    latitude: "",
    longitude: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
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
    const data = formData;
    if (authIsOwner) {
      data.ownerId = authUserId;
    }
    if (!data.name
      || !data.ownerId
      || !data.latitude
      || !data.longitude
      || !data.streetAddress
      || !data.city
      || !data.state
      || !data.zipCode
      || !data.country
    ) {
      setValidated(true);
      return;
    }
    const site = await dispatch(siteAdd(data)).unwrap();
    if (site) {
      const { latitude: lat, longitude: lng } = site;
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
        <CModalTitle>Add New Site</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm noValidate validated={validated}>
          {authIsAdmin &&
            <FormInput
              InputForm={CFormInput}
              name="ownerId"
              type="text"
              placeholder="Owner ID"
              value={formData.ownerId}
              onChange={handleInputChange}
              feedbackInvalid="Please provide owner ID"
              required
            />}
          <FormInput
            InputForm={CFormInput}
            name="name"
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
            feedbackInvalid="Please provide site name"
            required
          />
          <FormInput
            InputForm={CFormInput}
            name="latitude"
            type="text"
            placeholder="Latitude"
            value={formData.latitude}
            onChange={handleInputChange}
            feedbackInvalid="Please provide site latitude"
            required
          />
          <FormInput
            InputForm={CFormInput}
            name="longitude"
            type="text"
            placeholder="Longitude"
            value={formData.longitude}
            onChange={handleInputChange}
            feedbackInvalid="Please provide site longitude"
            required
          />
          <FormInput
            InputForm={CFormInput}
            name="streetAddress"
            type="text"
            placeholder="Street Address"
            value={formData.streetAddress}
            onChange={handleInputChange}
            feedbackInvalid="Please provide street address"
            required
          />
          <FormInput
            InputForm={CFormInput}
            name="city"
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={handleInputChange}
            feedbackInvalid="Please provide city name"
            required
          />
          <FormInput
            InputForm={CFormInput}
            name="state"
            type="text"
            placeholder="State"
            value={formData.state}
            onChange={handleInputChange}
            feedbackInvalid="Please provide state name"
            required
          />
          <FormInput
            InputForm={CFormInput}
            name="zipCode"
            type="text"
            placeholder="Zip Code"
            value={formData.zipCode}
            onChange={handleInputChange}
            feedbackInvalid="Please provide zip code"
            required
          />
          <FormInput
            InputForm={CFormInput}
            name="country"
            type="text"
            placeholder="Country"
            value={formData.country}
            onChange={handleInputChange}
            feedbackInvalid="Please provide country"
            required
          />
          <div className="text-center">
            <CButton
              className="w-100"
              variant="outline"
              color="info"
              onClick={handleSubmit}
            >
              Add
            </CButton>
          </div>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default SiteAddModal;
