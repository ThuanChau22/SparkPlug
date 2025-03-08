import { useCallback, useEffect, useState, useMemo } from "react";
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
import EvseManagement from "components/StationManagement/EvseManagement";
import LoadingIndicator from "components/LoadingIndicator";
import useFetchData from "hooks/useFetchData";
import { selectAuthRoleIsStaff } from "redux/auth/authSlice";
import { mapStateSet } from "redux/map/mapSlice";
import {
  StationFields,
  stationGetById,
  stationUpdateById,
  stationDeleteById,
  selectStationById,
} from "redux/station/stationSlice";
import utils from "utils";

const StationDetailsModal = ({ isOpen, onClose, stationId }) => {
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const station = useSelector((state) => selectStationById(state, stationId));

  const [isEdit, setIsEdit] = useState(false);
  const [isDelete, setIsDelete] = useState(false);

  const fetchOnLoad = useMemo(() => {
    const filter = (field) => station[field] === undefined;
    return Object.values(StationFields).filter(filter).length > 0;
  }, [station]);

  const { loadState } = useFetchData({
    condition: fetchOnLoad,
    action: useCallback(() => stationGetById(stationId), [stationId]),
  });

  const dispatch = useDispatch();

  useEffect(() => {
    const { latitude: lat, longitude: lng } = station;
    if (utils.hasLatLngValue({ lat, lng })) {
      dispatch(mapStateSet({
        center: { lat, lng },
        zoom: 20,
      }))
    }
  }, [station, dispatch]);

  const InfoModal = () => (
    <>
      <div className="d-flex justify-content-between">
        <small className="text-secondary ps-3 my-auto">Station ID: {station.id}</small>
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
      <CModalBody className="pb-0">
        {authIsAdmin && (
          <p>
            <span>Owner ID: </span>
            <span className="text-secondary">
              {station.owner_id}
            </span>
          </p>
        )}
        <p>
          <span>Site ID: </span>
          <span className="text-secondary">
            {station.site_id}
          </span>
        </p>
        <p>
          <span>Site Name: </span>
          <span className="text-secondary">
            {station.site_name}
          </span>
        </p>
        <p>
          <span>Address: </span>
          <span className="text-secondary">
            <span>{station.street_address}, </span>
            <span>{station.city}, </span>
            <span>{station.state} </span>
            <span>{station.zip_code}, </span>
            <span>{station.country}</span>
          </span>
        </p>
        <p>
          <span>Coordinate: </span>
          <span className="text-secondary">
            {station.latitude}, {station.longitude}
          </span>
        </p>
      </CModalBody>
    </>
  );

  const EditModal = () => {
    const initialFormData = {
      name: "",
      siteId: "",
      latitude: "",
      longitude: "",
    };
    const [formData, setFormData] = useState(initialFormData);
    const [validated, setValidated] = useState(false);

    useEffect(() => {
      if (station) {
        setFormData({
          name: station.name,
          siteId: station.site_id,
          latitude: station.latitude,
          longitude: station.longitude,
        });
      }
    }, []);

    const handleInputChange = ({ target }) => {
      const { name, value } = target;
      setFormData({ ...formData, [name]: value });
    };

    const handleSave = () => {
      const data = {
        ...formData,
        id: station.id,
      };
      if (!data.name
        || !data.siteId
        || !data.latitude
        || !data.longitude
      ) {
        setValidated(true);
        return;
      }
      dispatch(stationUpdateById(data));
      setIsEdit(false);
    };

    return (
      <CModalBody>
        <CForm noValidate validated={validated}>
          <FormInput
            InputForm={CFormInput}
            label="Site ID"
            name="siteId"
            type="text"
            placeholder="Site ID"
            value={formData.siteId}
            feedbackInvalid="Please select a site ID"
            required
            disabled
          />
          <FormInput
            InputForm={CFormInput}
            label="Name"
            name="name"
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
            feedbackInvalid="Please provide station name"
            required
          />
          <FormInput
            InputForm={CFormInput}
            label="Latitude"
            name="latitude"
            type="text"
            placeholder="Latitude"
            value={formData.latitude}
            onChange={handleInputChange}
            feedbackInvalid="Please provide station latitude"
            required
          />
          <FormInput
            InputForm={CFormInput}
            label="Longitude"
            name="longitude"
            type="text"
            placeholder="Longitude"
            value={formData.longitude}
            onChange={handleInputChange}
            feedbackInvalid="Please provide station longitude"
            required
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
        </CForm>
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
        <CForm>
          <label htmlFor="stationName">Type "{name}" to delete station</label>
          <CFormInput
            className="mb-3 shadow-none"
            id="stationName"
            type="text"
            name="name"
            placeholder="Confirmation"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
          />
          <CButton
            variant="outline"
            color="danger"
            disabled={name !== inputName}
            onClick={handleDelete}
          >
            Delete
          </CButton>
          <CButton
            className="ms-2"
            variant="outline"
            color="secondary"
            onClick={() => setIsDelete(false)}
          >
            Cancel
          </CButton>
        </CForm>
      </CModalBody>
    );
  };

  return (
    <CModal
      alignment="center"
      backdrop="static"
      visible={isOpen}
      onClose={onClose}
    >
      <CModalHeader className="mb-2">
        {!loadState.loading &&
          <CModalTitle>
            {station.name}
          </CModalTitle>
        }
      </CModalHeader>
      {loadState.loading
        ? <LoadingIndicator loading={loadState.loading} />
        : isEdit
          ? <EditModal />
          : isDelete
            ? <DeleteModal />
            : (
              <>
                <InfoModal />
                <EvseManagement stationId={stationId} />
              </>
            )
      }
    </CModal >
  );
};

export default StationDetailsModal;
