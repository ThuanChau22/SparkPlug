import { useSelector } from "react-redux";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from "@coreui/react";

import { selectSiteById } from "redux/site/siteSlide";

const SiteDetailsModal = ({ isOpen, onClose, siteId }) => {
  const site = useSelector((state) => selectSiteById(state, siteId));
  return (
    <CModal
      alignment="center"
      visible={isOpen}
      onClose={onClose}
    >
      <CModalHeader className="mb-2">
        <CModalTitle>{site.name}</CModalTitle>
      </CModalHeader>
      <p className="ps-3" >Site ID: {site.id}</p>
      <CModalBody>
        <p>Owner ID: {site.owner_id}</p>
        <p>Address: {site.street_address}, {site.city}, {site.state} {site.zip_code}</p>
        <p>Coordinate: {site.latitude}, {site.longitude}</p>
      </CModalBody>
    </CModal>
  );
};

export default SiteDetailsModal;
