import React, { useState, useEffect } from "react";
import "../scss/Modal.scss"; // Importing a general modal style

const UserEditModal = ({ isOpen, onClose, userData, onSave }) => {
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");

  useEffect(() => {
    if (userData) {
      setEditedName(userData.name || "");
      setEditedEmail(userData.email || "");
    }
  }, [userData]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ ...userData, name: editedName, email: editedEmail });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <label htmlFor="userName">User Name</label>
        <input
          id="userName"
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
        />
        <label htmlFor="userEmail">User Email</label>
        <input
          id="userEmail"
          type="email"
          value={editedEmail}
          onChange={(e) => setEditedEmail(e.target.value)}
        />
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default UserEditModal;
