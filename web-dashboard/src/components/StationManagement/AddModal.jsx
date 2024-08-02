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

import {
  siteGetList,
  selectSiteIds,
} from "redux/site/siteSlide";
import { stationAdd } from "redux/station/stationSlide";

const StationAddModal = ({ isOpen, onClose }) => {
  const siteIds = useSelector(selectSiteIds);

  const initialFormData = {
    name: "",
    siteId: "",
    latitude: "",
    longitude: "",
  };
  const [formData, setFormData] = useState(initialFormData);

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
      || !formData.longitude) {
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
        <CForm>
          <CFormInput
            className="mb-3 shadow-none"
            type="text"
            name="name"
            placeholder="Name"
            onChange={handleInputChange}
            value={formData.name}
          />
          <CFormSelect
            className="mb-3 shadow-none"
            name="siteId"
            onChange={handleInputChange}
            value={formData.siteId}
            options={[
              { label: "Select Site ID", value: "" },
              ...siteOptions.map((id) => (
                { label: id, value: id }
              )),
            ]}
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
            name="longitude"
            placeholder="Longitude"
            onChange={handleInputChange}
            value={formData.longitude}
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
