import { useEffect, useState } from "react";
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

import EvseManagement from "components/EvseManagement";
import {
  selectAuthRoleIsStaff,
} from "redux/auth/authSlice";
import {
  siteGetAll,
  selectSiteList,
} from "redux/site/siteSlide";
import {
  stationUpdateById,
  stationDeleteById,
  selectStationById,
} from "redux/station/stationSlide";

const StationDetailsModal = ({ isOpen, onClose, stationId }) => {
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const siteList = useSelector(selectSiteList);
  const station = useSelector((state) => selectStationById(state, stationId));
  const [siteOptions, setSiteOptions] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (siteList.length === 0) {
      dispatch(siteGetAll());
    }
  }, [siteList, dispatch]);

  useEffect(() => {
    setSiteOptions(siteList.map(site => site.id));
  }, [siteList]);

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
        {authIsAdmin && <p>Owner ID: {station.owner_id}</p>}
        <p>Site ID: {station.site_id}</p>
        <p>Site Name: {station.site_name}</p>
        <p>
          <span>Address: </span>
          <span>{station.street_address}, </span>
          <span>{station.city}, </span>
          <span>{station.state} </span>
          <span>{station.zip_code}, </span>
          <span>{station.country}</span>
        </p>
        <p>Coordinate: {station.latitude}, {station.longitude}</p>
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
        || !data.longitude) {
        return;
      }
      dispatch(stationUpdateById(data));
      setIsEdit(false);
    };

    return (
      <CModalBody className="pb-0">
        <CForm>
          <label htmlFor="stationName">Station Name</label>
          <CFormInput
            className="mb-3 shadow-none"
            id="stationName"
            name="name"
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
          />
          <label htmlFor="siteId">Site ID</label>
          <CFormSelect
            className="mb-3 shadow-none"
            id="siteId"
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
          <label htmlFor="latitude">Latitude</label>
          <CFormInput
            className="mb-3 shadow-none"
            id="latitude"
            name="latitude"
            type="text"
            placeholder="Latitude"
            onChange={handleInputChange}
            value={formData.latitude}
          />
          <label htmlFor="longitude">Longitude</label>
          <CFormInput
            className="mb-3 shadow-none"
            id="longitude"
            name="longitude"
            type="text"
            placeholder="Longitude"
            onChange={handleInputChange}
            value={formData.longitude}
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
      <CModalBody className="pb-0">
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
        <CModalTitle>{station.name}</CModalTitle>
      </CModalHeader>
      {isEdit
        ? <EditModal />
        : isDelete
          ? <DeleteModal />
          : <InfoModal />
      }
      <EvseManagement stationId={stationId} />
    </CModal >
  );
};

export default StationDetailsModal;
