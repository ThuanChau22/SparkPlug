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

import FormInput from "components/FormInput";
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
} from "redux/site/siteSlice";

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
          <FormInput
            InputForm={CFormInput}
            label="Name"
            name="name"
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
            feedbackInvalid="Please provide site name"
            required
          />
          {authIsAdmin &&
            <FormInput
              InputForm={CFormInput}
              label="Owner ID"
              name="ownerId"
              type="text"
              placeholder="Owner ID"
              value={formData.ownerId}
              onChange={handleInputChange}
              feedbackInvalid="Please provide owner ID"
              required
            />}
          <FormInput
            InputForm={CFormInput}
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
