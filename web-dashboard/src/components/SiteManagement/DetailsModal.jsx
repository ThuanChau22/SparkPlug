import { useCallback, useEffect, useMemo, useState } from "react";
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
import LoadingIndicator from "components/LoadingIndicator";
import useFetchData from "hooks/useFetchData";
import useMapZoom from "hooks/useMapZoom";
import {
  selectAuthUserId,
  selectAuthRoleIsStaff,
  selectAuthRoleIsOwner,
} from "redux/auth/authSlice";
import {
  SiteFields,
  siteGetById,
  siteUpdateById,
  siteDeleteById,
  selectSiteById,
} from "redux/site/siteSlice";

const SiteDetailsModal = ({ isOpen, onClose, siteId }) => {
  const authUserId = useSelector(selectAuthUserId);
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const authIsOwner = useSelector(selectAuthRoleIsOwner);
  const site = useSelector((state) => selectSiteById(state, siteId));

  const [isEdit, setIsEdit] = useState(false);
  const [isDelete, setIsDelete] = useState(false);

  const fetchOnLoad = useMemo(() => {
    const filter = (field) => site[field] === undefined;
    return Object.values(SiteFields).filter(filter).length > 0;
  }, [site]);

  const { loadState } = useFetchData({
    condition: fetchOnLoad,
    action: useCallback(() => siteGetById(siteId), [siteId]),
  });

  useMapZoom({
    lat: site.latitude,
    lng: site.longitude,
  });

  const dispatch = useDispatch();

  const InfoModal = () => (
    <>
      <div className="d-flex justify-content-between">
        <small className="text-secondary ps-3 my-auto">Site ID: {site.id}</small>
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
      <CModalBody className="pt-1">
        {authIsAdmin && (
          <p>
            <span>Owner ID: </span>
            <span className="text-secondary">
              {site.owner_id}
            </span>
          </p>
        )}
        <p>
          <span>Address: </span>
          <span className="text-secondary">
            <span>{site.street_address}, </span>
            <span>{site.city}, </span>
            <span>{site.state} </span>
            <span>{site.zip_code}, </span>
            <span>{site.country}</span>
          </span>
        </p>
        <p>
          <span>Coordinate: </span>
          <span className="text-secondary">
            {site.latitude}, {site.longitude}
          </span>
        </p>
      </CModalBody>
    </>
  );

  const EditModal = () => {
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
    const [validated, setValidated] = useState(false);

    useEffect(() => {
      if (site) {
        setFormData({
          name: site.name,
          ownerId: site.owner_id,
          latitude: site.latitude,
          longitude: site.longitude,
          streetAddress: site.street_address,
          city: site.city,
          state: site.state,
          zipCode: site.zip_code,
          country: site.country,
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
        id: site.id,
      };
      if (authIsOwner) {
        data.ownerId = authUserId;
      }
      if (!data.name
        || !data.ownerId
        || !data.latitude
        || !data.longitude
        || !data.streetAddress
        || !data.city
        || !data.state
        || !data.zipCode
        || !data.country
      ) {
        setValidated(true);
        return;
      }
      dispatch(siteUpdateById(data));
      setIsEdit(false);
    };

    return (
      <CModalBody>
        <CForm noValidate validated={validated}>
          {authIsAdmin && (
            <FormInput
              InputForm={CFormInput}
              className="mb-3"
              label="Owner ID"
              name="ownerId"
              type="text"
              placeholder="Owner ID"
              value={formData.ownerId}
              feedbackInvalid="Please provide owner ID"
              required
              disabled
            />
          )}
          <FormInput
            InputForm={CFormInput}
            className="mb-3"
            label="Name"
            name="name"
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
            feedbackInvalid="Please provide site name"
            required
          />
          <FormInput
            InputForm={CFormInput}
            className="mb-3"
            label="Latitude"
            name="latitude"
            type="text"
            placeholder="Latitude"
            value={formData.latitude}
            onChange={handleInputChange}
            feedbackInvalid="Please provide site latitude"
            required
          />
          <FormInput
            InputForm={CFormInput}
            className="mb-3"
            label="Longitude"
            name="longitude"
            type="text"
            placeholder="Longitude"
            value={formData.longitude}
            onChange={handleInputChange}
            feedbackInvalid="Please provide site longitude"
            required
          />
          <FormInput
            InputForm={CFormInput}
            className="mb-3"
            label="Street Address"
            name="streetAddress"
            type="text"
            placeholder="Street Address"
            value={formData.streetAddress}
            onChange={handleInputChange}
            feedbackInvalid="Please provide street address"
            required
          />
          <FormInput
            InputForm={CFormInput}
            className="mb-3"
            label="City"
            name="city"
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={handleInputChange}
            feedbackInvalid="Please provide city name"
            required
          />
          <FormInput
            InputForm={CFormInput}
            className="mb-3"
            label="State"
            name="state"
            type="text"
            placeholder="State"
            value={formData.state}
            onChange={handleInputChange}
            feedbackInvalid="Please provide state name"
            required
          />
          <FormInput
            InputForm={CFormInput}
            className="mb-3"
            label="Zip Code"
            name="zipCode"
            type="text"
            placeholder="Zip Code"
            value={formData.zipCode}
            onChange={handleInputChange}
            feedbackInvalid="Please provide zip code"
            required
          />
          <FormInput
            InputForm={CFormInput}
            className="mb-3"
            label="Country"
            name="country"
            type="text"
            placeholder="Country"
            value={formData.country}
            onChange={handleInputChange}
            feedbackInvalid="Please provide country"
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
      if (site) {
        setName(site.name);
      }
    }, []);

    const handleDelete = () => {
      if (name !== inputName) {
        return;
      }
      dispatch(siteDeleteById(site.id));
      onClose();
    };

    return (
      <CModalBody>
        <CForm>
          <label
            className="mb-2"
            htmlFor="siteName"
          >
            Type "{name}" to delete site
          </label>
          <FormInput
            InputForm={CFormInput}
            className="mb-3"
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
            {site.name}
          </CModalTitle>
        }
      </CModalHeader>
      {loadState.loading
        ? <LoadingIndicator loading={loadState.loading} />
        : isEdit
          ? <EditModal />
          : isDelete
            ? <DeleteModal />
            : <InfoModal />
      }
    </CModal>
  );
};

export default SiteDetailsModal;
