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

import { selectSiteList } from "redux/site/siteSlide";
import { stationAdd } from "redux/station/stationSlide";
import "../scss/Modal.scss";

const StationAddModal = ({ isOpen, onClose }) => {
  const siteList = useSelector(selectSiteList);
  const [formData, setFormData] = useState({
    name: "",
    chargeLevel: "",
    connectorType: "",
    latitude: "",
    longitude: "",
    siteId: ""
  });
  const [siteOptions, setSiteOptions] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (siteList) {
      setSiteOptions(siteList.map(site => site.id));
    }
  }, [siteList]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    const stationData = {
      name: formData.name,
      charge_level: Number(formData.chargeLevel),
      connector_type: formData.connectorType,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      site_id: formData.siteId ? Number(formData.siteId) : null
    };
    dispatch(stationAdd(stationData));
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
            name="chargeLevel"
            value={formData.chargeLevel}
            onChange={handleInputChange}
            options={[
              { label: "chargeLevel", value: "" },
              { label: "1", value: "" },
              { label: "2", value: "2" },
              { label: "3", value: "3" },
            ]}
          />
          <CFormInput
            className="mb-3 shadow-none"
            type="text"
            name="connectorType"
            placeholder="Connector Type"
            onChange={handleInputChange}
            value={formData.connectorType}
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
          <CFormSelect
            name="siteId"
            onChange={handleInputChange}
            value={formData.siteId}
            options={[
              { label: "Select Site ID" },
              ...siteOptions.map((id) => (
                { label: id, value: id }
              )),
            ]}
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
