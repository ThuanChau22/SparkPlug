import { useState } from "react";
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

import {
  selectAuthUserId,
  selectAuthRoleIsStaff,
  selectAuthRoleIsOwner,
} from "redux/auth/authSlice";
import { siteAdd } from "redux/site/siteSlide";

const SiteAddModal = ({ isOpen, onClose }) => {
  const userId = useSelector(selectAuthUserId);
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const authIsOwner = useSelector(selectAuthRoleIsOwner);
  const initialFormData = {
    name: "",
    ownerId: "",
    latitude: "",
    longitude: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  };
  const [formData, setFormData] = useState(initialFormData);
  const dispatch = useDispatch();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    const data = formData;
    if (authIsOwner) {
      data.ownerId = userId;
    }
    if (!data.name
      || !data.ownerId
      || !data.latitude
      || !data.longitude
      || !data.streetAddress
      || !data.city
      || !data.state
      || !data.zipCode
      || !data.country) {
      return;
    }
    dispatch(siteAdd(data));
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
          {authIsAdmin &&
            <CFormInput
              className="mb-3 shadow-none"
              type="text"
              name="ownerId"
              placeholder="Owner ID"
              onChange={handleInputChange}
              value={formData.ownerId}
            />}
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
            name="streetAddress"
            placeholder="Street Address"
            onChange={handleInputChange}
            value={formData.streetAddress}
          />
          <CFormInput
            className="mb-3 shadow-none"
            type="text"
            name="city"
            placeholder="City"
            onChange={handleInputChange}
            value={formData.city}
          />
          <CFormInput
            className="mb-3 shadow-none"
            type="text"
            name="state"
            placeholder="State"
            onChange={handleInputChange}
            value={formData.state}
          />
          <CFormInput
            className="mb-3 shadow-none"
            type="text"
            name="zipCode"
            placeholder="Zip Code"
            onChange={handleInputChange}
            value={formData.zipCode}
          />
          <CFormInput
            className="mb-3 shadow-none"
            type="text"
            name="country"
            placeholder="Country"
            onChange={handleInputChange}
            value={formData.country}
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
