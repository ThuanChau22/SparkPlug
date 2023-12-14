import { useSelector } from "react-redux";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from "@coreui/react";

import { selectStationById } from "redux/station/stationSlide";

const StationDetailsModal = ({ isOpen, onClose, stationId }) => {
  const station = useSelector((state) => selectStationById(state, stationId));

  const formatPrice = (price) => {
    const options = { style: 'currency', currency: 'USD' };
    return new Intl.NumberFormat('en-US', options).format(price);
  };

  return (
    <CModal
      alignment="center"
      visible={isOpen}
      onClose={onClose}
    >
      <CModalHeader className="mb-2">
        <CModalTitle>{station.name}</CModalTitle>
      </CModalHeader>
      <p className="ps-3">Station ID: {station.id}</p>
      <CModalBody>
        <p>Owner ID: {station.owner_id}</p>
        <p>Price: {formatPrice(station.price)}</p>
        <p>Charge Level: {station.charge_level}</p>
        <p>Connector Type: {station.connector_type}</p>
        <p>Coordinate: {station.latitude}, {station.longitude}</p>
        <p>Site ID: {station.site_id}</p>
        <p>Address: {station.street_address}, {station.city}, {station.state} {station.zip_code}</p>
      </CModalBody>
    </CModal>
  );
};

export default StationDetailsModal;
