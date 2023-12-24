import { useEffect, useState } from "react";
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
  stationDeleteById,
  selectStationById,
} from "redux/station/stationSlide";

const StationDetailsModal = ({ isOpen, onClose, stationId }) => {
  const station = useSelector((state) => selectStationById(state, stationId));
  const [isEdit, setIsEdit] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const dispatch = useDispatch();

  const InfoModal = () => {

    const formatPrice = (price) => {
      const options = { style: 'currency', currency: 'USD' };
      return new Intl.NumberFormat('en-US', options).format(price);
    };

    return (
      <>
        <div className="d-flex justify-content-between">
          <small className="text-secondary ps-3 my-auto">ID: {station.id}</small>
          <div>
            <CButton
              className="me-2"
              variant="outline"
              color="warning"
              onClick={() => setIsEdit(true)}
            >
              Edit
            </CButton>
            <CButton
              className="me-3"
              variant="outline"
              color="danger"
              onClick={() => setIsDelete(true)}
            >
              Delete
            </CButton>
          </div>
        </div>
        <CModalBody>
          <p>Owner ID: {station.owner_id}</p>
          <p>Price: {formatPrice(station.price)}</p>
          <p>Charge Level: {station.charge_level}</p>
          <p>Connector Type: {station.connector_type}</p>
          <p>Coordinate: {station.latitude}, {station.longitude}</p>
          <p>Site ID: {station.site_id}</p>
          <p>Address: {station.street_address}, {station.city}, {station.state} {station.zip_code}</p>
        </CModalBody>
      </>
    );
  };

  const EditModal = () => {
    const initialInput = { name: "", price: "" };
    const [input, setInput] = useState(initialInput);

    useEffect(() => {
      if (station) {
        setInput({
          name: station.name,
          price: station.price,
        });
      }
    }, []);

    const handleInputChanged = ({ target }) => {
      const { name, value } = target;
      setInput({ ...input, [name]: value });
    };

    const handleSave = () => {
      if (!input.name || !input.price) {
        return;
      }
      const stationData = {
        id: station.id,
        name: input.name,
        price: parseFloat(input.price)
      };
      dispatch(stationUpdateById(stationData));
      setIsEdit(false);
    };

    return (
      <CModalBody>
        <label htmlFor="stationName">Station Name</label>
        <CFormInput
          className="mb-3 shadow-none"
          id="stationName"
          name="name"
          type="text"
          value={input.name}
          onChange={handleInputChanged}
        />
        <label htmlFor="stationPrice">Station Price</label>
        <CFormInput
          className="mb-3 shadow-none"
          id="stationPrice"
          name="price"
          type="number"
          value={input.price}
          onChange={handleInputChanged}
        />
        <CButton
          variant="outline"
          color="warning"
          onClick={handleSave}
        >
          Save
        </CButton>
        <CButton
          className="ms-2"
          variant="outline"
          color="secondary"
          onClick={() => setIsEdit(false)}
        >
          Cancel
        </CButton>
      </CModalBody>
    );
  };

  const DeleteModal = () => {
    const [name, setName] = useState("");
    const [inputName, setInputName] = useState("");

    useEffect(() => {
      if (station) {
        setName(station.name);
      }
    }, []);

    const handleDelete = () => {
      if (name !== inputName) {
        return;
      }
      dispatch(stationDeleteById(station.id));
      onClose();
    };

    return (
      <CModalBody>
        <label htmlFor="stationName">Type "{name}" to delete station</label>
        <CFormInput
          className="mb-3 shadow-none"
          id="stationName"
          type="text"
          name="name"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
        />
        <div className="float-end">
          <CButton
            variant="outline"
            color="secondary"
            onClick={() => setIsDelete(false)}
          >
            Cancel
          </CButton>
          <CButton
            className="ms-2"
            variant="outline"
            color="danger"
            disabled={name !== inputName}
            onClick={handleDelete}
          >
            Delete
          </CButton>
        </div>
      </CModalBody>
    );
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
      {isEdit
        ? <EditModal />
        : isDelete
          ? <DeleteModal />
          : <InfoModal />
      }
    </CModal>
  );
};

export default StationDetailsModal;
