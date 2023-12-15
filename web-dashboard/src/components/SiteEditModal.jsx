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
  siteUpdateById,
  selectSiteById,
} from "redux/site/siteSlide";

const SiteEditModal = ({ isOpen, onClose, siteId }) => {
  const site = useSelector((state) => selectSiteById(state, siteId));
  const [editedName, setEditedName] = useState("");
  const dispatch = useDispatch();
  useEffect(() => {
    if (site) {
      setEditedName(site.name || "");
    }
  }, [site]);
  const handleSave = () => {
    if (!editedName) {
      return;
    }
    const siteData = {
      id: site.id,
      name: editedName,
    };
    dispatch(siteUpdateById(siteData));
    onClose();
  };
  return (
    <CModal
      alignment="center"
      visible={isOpen}
      onClose={onClose}
    >
      <CModalHeader>
        <CModalTitle>Edit Site</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <label htmlFor="siteName">Site Name</label>
        <CFormInput
          className="mb-3 shadow-none"
          id="siteName"
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
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

export default SiteEditModal;
