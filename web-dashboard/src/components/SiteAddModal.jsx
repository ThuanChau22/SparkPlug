import { useState } from "react";
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

import { siteAdd } from "redux/site/siteSlide";

const SiteAddModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    ownerId: "",
    streetAddress: "",
    latitude: "",
    longitude: "",
    zipCode: ""
  });
  const dispatch = useDispatch();
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleSubmit = () => {
    if (!formData.name
      || !formData.ownerId
      || !formData.streetAddress
      || !formData.latitude
      || !formData.longitude
      || !formData.zipCode) {
      return;
    }
    const siteData = {
      name: formData.name,
      owner_id: Number(formData.ownerId),
      street_address: formData.streetAddress,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      zip_code: formData.zipCode,
    };
    dispatch(siteAdd(siteData));
    onClose();
  };
  return (
    <CModal
      backdrop="static"
      alignment="center"
      visible={isOpen}
      onClose={onClose}
    >
      <CModalHeader className="mb-2">
        <CModalTitle>Add New Site</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <CFormInput
            className="mb-3 shadow-none"
            type="text"
            name="name"
            placeholder="Name"
            onChange={handleInputChange}
            value={formData.name}
          />
          <CFormInput
            className="mb-3 shadow-none"
            type="text"
            name="ownerId"
            placeholder="Owner ID"
            onChange={handleInputChange}
            value={formData.ownerId}
          />
          <CFormInput
            className="mb-3 shadow-none"
            type="text"
            name="streetAddress"
            placeholder="Street Address"
            onChange={handleInputChange}
            value={formData.streetAddress}
          />
          <CFormInput
            className="mb-3 shadow-none"
            type="text"
            name="latitude"
            placeholder="Latitude"
            onChange={handleInputChange}
            value={formData.latitude}
          />
          <CFormInput
            className="mb-3 shadow-none"
            type="text"
            name="longitude" placeholder="Longitude"
            onChange={handleInputChange}
            value={formData.longitude} />
          <CFormInput
            className="mb-3 shadow-none"
            type="text"
            name="zipCode"
            placeholder="Zip Code"
            onChange={handleInputChange}
            value={formData.zipCode}
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
