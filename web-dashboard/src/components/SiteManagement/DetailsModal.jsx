import { useCallback, useEffect, useState } from "react";
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

import LoadingIndicator from "components/LoadingIndicator";
import {
  selectAuthUserId,
  selectAuthRoleIsStaff,
  selectAuthRoleIsOwner,
} from "redux/auth/authSlice";
import {
  siteGetById,
  siteUpdateById,
  siteDeleteById,
  selectSiteById,
} from "redux/site/siteSlide";

const SiteDetailsModal = ({ isOpen, onClose, siteId }) => {
  const userId = useSelector(selectAuthUserId);
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const authIsOwner = useSelector(selectAuthRoleIsOwner);
  const site = useSelector((state) => selectSiteById(state, siteId));

  const [loading, setLoading] = useState(false);

  const [isEdit, setIsEdit] = useState(false);
  const [isDelete, setIsDelete] = useState(false);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (!site) {
      setLoading(true);
      await dispatch(siteGetById(siteId)).unwrap();
      setLoading(false);
    }
  }, [siteId, site, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        {authIsAdmin && <p>Owner ID: {site.owner_id}</p>}
        <p>
          <span>Address: </span>
          <span>{site.street_address}, </span>
          <span>{site.city}, </span>
          <span>{site.state} </span>
          <span>{site.zip_code}, </span>
          <span>{site.country}</span>
        </p>
        <p>Coordinate: {site.latitude}, {site.longitude}</p>
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
        data.ownerId = userId;
      }
      if (!data.name
        || !data.ownerId
        || !data.latitude
        || !data.longitude
        || !data.streetAddress
        || !data.city
        || !data.state
        || !data.zipCode
        || !data.country) {
        return;
      }
      dispatch(siteUpdateById(data));
      setIsEdit(false);
    };

    return (
      <CModalBody>
        <CForm>
          <label htmlFor="siteName">Name</label>
          <CFormInput
            className="mb-3 shadow-none"
            id="siteName"
            name="name"
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
          />
          {authIsAdmin &&
            <>
              <label htmlFor="ownerId">Owner ID</label>
              <CFormInput
                className="mb-3 shadow-none"
                id="ownerId"
                name="ownerId"
                type="text"
                placeholder="Owner ID"
                onChange={handleInputChange}
                value={formData.ownerId}
              />
            </>}
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
            name="longitude"
            id="longitude"
            type="text"
            placeholder="Longitude"
            onChange={handleInputChange}
            value={formData.longitude}
          />
          <label htmlFor="streetAddress">Street Address</label>
          <CFormInput
            className="mb-3 shadow-none"
            id="streetAddress"
            name="streetAddress"
            type="text"
            placeholder="Street Address"
            onChange={handleInputChange}
            value={formData.streetAddress}
          />
          <label htmlFor="city">City</label>
          <CFormInput
            className="mb-3 shadow-none"
            id="city"
            name="city"
            type="text"
            placeholder="City"
            onChange={handleInputChange}
            value={formData.city}
          />
          <label htmlFor="state">State</label>
          <CFormInput
            className="mb-3 shadow-none"
            id="state"
            name="state"
            type="text"
            placeholder="State"
            onChange={handleInputChange}
            value={formData.state}
          />
          <label htmlFor="zipCode">Zip Code</label>
          <CFormInput
            className="mb-3 shadow-none"
            id="zipCode"
            name="zipCode"
            type="text"
            placeholder="Zip Code"
            onChange={handleInputChange}
            value={formData.zipCode}
          />
          <label htmlFor="country">Country</label>
          <CFormInput
            className="mb-3 shadow-none"
            id="country"
            name="country"
            type="text"
            placeholder="Country"
            onChange={handleInputChange}
            value={formData.country}
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
          <label htmlFor="siteName">Type "{name}" to delete site</label>
          <CFormInput
            className="mb-3 shadow-none"
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
        {!loading &&
          <CModalTitle>
            {site.name}
          </CModalTitle>
        }
      </CModalHeader>
      {loading
        ? <LoadingIndicator loading={loading} />
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
