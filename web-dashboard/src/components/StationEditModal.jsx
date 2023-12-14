import { useState, useEffect } from "react";
import {
  CButton,
  CModal,
} from "@coreui/react";

import { selectStationById } from "redux/station/stationSlide";

import "../scss/Modal.scss";
import { useSelector } from "react-redux";

const StationEditModal = ({ isOpen, onClose, stationId, onSave }) => {
  const station = useSelector((state) => selectStationById(state, stationId))
  const [editedName, setEditedName] = useState("");
  const [editedPrice, setEditedPrice] = useState("");

  useEffect(() => {
    if (station) {
      setEditedName(station.name || "");
      setEditedPrice(station.price || "");
    }
  }, [station]);

  const handleSave = () => {
    onSave(station.id, editedName, parseFloat(editedPrice));
    onClose();
  };

  return (
    <CModal
      alignment="center"
      visible={isOpen}
      onClose={onClose}
    >
      <div className="modal-content">
        <label htmlFor="stationName">Station Name</label>
        <input
          id="stationName"
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
        />
        <label htmlFor="stationPrice">Station Price</label>
        <input
          id="stationPrice"
          type="number"
          value={editedPrice}
          onChange={(e) => setEditedPrice(e.target.value)}
        />
        <CButton
          className="w-100"
          variant="outline"
          color="warning"
          onClick={handleSave}
        >
          Save
        </CButton>
        <CButton
          className="w-100"
          variant="outline"
          color="warning"
          onClick={onClose}
        >
          Cancel
        </CButton>
      </div>
    </CModal>
  );
};

export default StationEditModal;
