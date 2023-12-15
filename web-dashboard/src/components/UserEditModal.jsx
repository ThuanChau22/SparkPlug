import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CFormInput,
  CFormSelect,
} from "@coreui/react";

import {
  userUpdateById,
  selectUserById
} from "redux/user/userSlide";

const UserEditModal = ({ isOpen, onClose, userId }) => {
  const user = useSelector((state) => selectUserById(state, userId));
  const [editedName, setEditedName] = useState("");
  const [editedStatus, setEditedStatus] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (user) {
      setEditedName(user.name || "");
      setEditedStatus(user.status || "");
    }
  }, [user]);

  const handleSave = () => {
    if (!editedName || !editedStatus) {
      return;
    }
    const userData = {
      id: user.id,
      name: editedName,
      status: editedStatus,
    };
    dispatch(userUpdateById(userData))
    onClose();
  };

  return (
    <CModal
      alignment="center"
      visible={isOpen}
      onClose={onClose}
    >
      <CModalHeader>
        <CModalTitle>Edit User</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <label htmlFor="userName">Name</label>
        <CFormInput
          className="mb-3 shadow-none"
          id="userName"
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
        />
        <label htmlFor="userStatus">Status</label>
        <CFormSelect
          className="mb-3 shadow-none"
          id="userStatus"
          options={[
            { label: "Active", value: "Active" },
            { label: "Blocked", value: "Blocked" },
            { label: "Terminated", value: "Terminated" },
          ]}
          value={editedStatus}
          onChange={(e) => setEditedStatus(e.target.value)}
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

export default UserEditModal;
