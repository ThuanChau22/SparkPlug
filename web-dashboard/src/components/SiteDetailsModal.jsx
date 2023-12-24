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
  siteUpdateById,
  siteDeleteById,
  selectSiteById,
} from "redux/site/siteSlide";

const SiteDetailsModal = ({ isOpen, onClose, siteId }) => {
  const site = useSelector((state) => selectSiteById(state, siteId));
  const [isEdit, setIsEdit] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const dispatch = useDispatch();

  const InfoModal = () => (
    <>
      <div className="d-flex justify-content-between">
        <small className="text-secondary ps-3 my-auto">ID: {site.id}</small>
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
        <p>Owner ID: {site.owner_id}</p>
        <p>Address: {site.street_address}, {site.city}, {site.state} {site.zip_code}</p>
        <p>Coordinate: {site.latitude}, {site.longitude}</p>
      </CModalBody>
    </>
  );

  const EditModal = () => {
    const initialInput = { name: "" };
    const [input, setInput] = useState(initialInput);

    useEffect(() => {
      if (site) {
        setInput({
          name: site.name,
        });
      }
    }, []);

    const handleInputChanged = ({ target }) => {
      const { name, value } = target;
      setInput({ ...input, [name]: value });
    };

    const handleSave = () => {
      if (!input.name) {
        return;
      }
      const siteData = {
        id: site.id,
        name: input.name,
      };
      dispatch(siteUpdateById(siteData));
      setIsEdit(false);
    };

    return (
      <CModalBody>
        <label htmlFor="siteName">Name</label>
        <CFormInput
          className="mb-3 shadow-none"
          id="siteName"
          name="name"
          type="text"
          value={input.name}
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
        <label htmlFor="siteName">Type "{name}" to delete site</label>
        <CFormInput
          className="mb-3 shadow-none"
          id="siteName"
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
        <CModalTitle>{site.name}</CModalTitle>
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

export default SiteDetailsModal;
