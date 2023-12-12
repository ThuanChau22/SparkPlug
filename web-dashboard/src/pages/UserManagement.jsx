import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  userGetAll,
  selectUserList,
  selectUserById,
  userUpdateById,
} from "redux/user/userSlide";
import "../scss/UserManagement.scss";
import UserEditModal from "../components/UserEditModal";

const UserManagement = () => {
  const userList = useSelector(selectUserList);
  const dispatch = useDispatch();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); //

  useEffect(() => {
    dispatch(userGetAll());
  }, [dispatch]);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSave = (updatedUser) => {
    dispatch(userUpdateById(updatedUser));
    setIsEditModalOpen(false);
  };

  return (
    <div className="user-management">
      <h2>User List</h2>
      {userList.map(({ id, name, email }) => {
        return (
          <div className="user-list-item" key={id}>
            <div className="user-id">ID: {id}</div>
            <div className="user-name">Name: {name}</div>
            <div className="user-email">Email: {email}</div>
            <div className="user-actions">
              <button onClick={() => handleEdit({ id, name, email })}>
                Edit
              </button>
            </div>
          </div>
        );
      })}
      {isEditModalOpen && (
        <UserEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          userData={selectedUser}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default UserManagement;
