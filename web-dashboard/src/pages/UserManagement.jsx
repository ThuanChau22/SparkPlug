import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import UserDetailsModal from "components/UserDetailsModal";
import UserEditModal from "components/UserEditModal";
import {
  userGetAll,
  selectUserList,
  userDeleteById,
} from "redux/user/userSlide";

const UserManagement = () => {
  const userList = useSelector(selectUserList);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (userList.length === 0) {
      dispatch(userGetAll());
    }
  }, [userList, dispatch]);

  const handleViewUser = (userId) => {
    setSelectedUserId(userId);
    setIsDetailsModalOpen(true);
  };

  const handleEditUser = (e, userId) => {
    setEditingUserId(userId);
    setIsEditModalOpen(true);
    e.stopPropagation();
  };

  const handleDeleteUser = (e, userId) => {
    dispatch(userDeleteById(userId));
    e.stopPropagation();
  };

  return (
    <CCard>
      <CCardBody>
        <CCardTitle className="d-flex flex-row justify-content-between align-items-center mb-3">
          Users Management
        </CCardTitle>
        <CListGroup>
          {userList.map(({ id, name, email }) => (
            <CListGroupItem
              key={id}
              className="list-item d-flex justify-content-between align-items-center py-3"
              onClick={() => handleViewUser(id)}
            >
              <div>ID: {id}</div>
              <div>Name: {name}</div>
              <div>Email: {email}</div>
              <div>
                <CButton
                  className="mx-1"
                  variant="outline"
                  color="warning"
                  onClick={(e) => handleEditUser(e, id)}
                >
                  Edit
                </CButton>
                <CButton
                  className="mx-1"
                  variant="outline"
                  color="danger"
                  onClick={(e) => handleDeleteUser(e, id)}
                >
                  Delete
                </CButton>
              </div>
            </CListGroupItem>
          ))}
        </CListGroup>
      </CCardBody>
      {isDetailsModalOpen && (
        <UserDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          userId={selectedUserId}
        />
      )}
      {isEditModalOpen && (
        <UserEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          userId={editingUserId}
        />
      )}
    </CCard>
  );
};

export default UserManagement;
