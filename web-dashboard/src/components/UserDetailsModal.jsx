import { useSelector } from "react-redux";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from "@coreui/react";

import { selectUserById } from "redux/user/userSlide";

const UserDetailsModal = ({ isOpen, onClose, userId }) => {
  const user = useSelector((state) => selectUserById(state, userId));
  return (
    <CModal
      alignment="center"
      visible={isOpen}
      onClose={onClose}
    >
      <CModalHeader className="mb-2">
        <CModalTitle>{user.name}</CModalTitle>
      </CModalHeader>
      <p className="ps-3" >User ID: {user.id}</p>
      <CModalBody>
        <p>Email: {user.email}</p>
        <p>Status: <span
          className={
            user.status === "Active"
              ? "text-success"
              : user.status === "Blocked"
                ? "text-warning"
                : "text-danger"
          }>
          {user.status}
        </span>
        </p>
        <p>Registered on: {new Date(user.created_at).toLocaleString("en-US")}</p>
      </CModalBody>
    </CModal>
  );
};

export default UserDetailsModal;
