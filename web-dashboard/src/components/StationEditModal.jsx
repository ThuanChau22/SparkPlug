import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CFormInput,
} from "@coreui/react";

import {
  stationUpdateById,
  selectStationById,
} from "redux/station/stationSlide";

const StationEditModal = ({ isOpen, onClose, stationId }) => {
  const station = useSelector((state) => selectStationById(state, stationId))
  const [editedName, setEditedName] = useState("");
  const [editedPrice, setEditedPrice] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (station) {
      setEditedName(station.name || "");
      setEditedPrice(station.price || "");
    }
  }, [station]);

  const handleSave = () => {
    if (!editedName || !editedPrice) {
      return;
    }
    const stationData = {
      id: station.id,
      name: editedName,
      price: parseFloat(editedPrice)
    };
    dispatch(stationUpdateById(stationData));
    onClose();
  };

  return (
    <CModal
      alignment="center"
      visible={isOpen}
      onClose={onClose}
    >
      <CModalHeader>
        <CModalTitle>Edit Station</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <label htmlFor="stationName">Station Name</label>
        <CFormInput
          className="mb-3 shadow-none"
          id="stationName"
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
        />
        <label htmlFor="stationPrice">Station Price</label>
        <CFormInput
          className="mb-3 shadow-none"
          id="stationPrice"
          type="number"
          value={editedPrice}
          onChange={(e) => setEditedPrice(e.target.value)}
        />
        <CButton
          variant="outline"
          color="warning"
          onClick={handleSave}
        >
          Save
        </CButton>
        <CButton
          className="mx-2"
          variant="outline"
          color="warning"
          onClick={onClose}
        >
          Cancel
        </CButton>
      </CModalBody>
    </CModal>
  );
};

export default StationEditModal;
