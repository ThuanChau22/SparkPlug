import { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CForm,
  CFormInput,
  CFormSelect,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import {
  userGetById,
  userUpdateById,
  userDeleteById,
  selectUserById,
  selectUserRoleById,
} from "redux/user/userSlice";

const UserDetailsModal = ({ isOpen, onClose, userId }) => {
  const user = useSelector((state) => selectUserById(state, userId));
  const userRole = useSelector((state) => selectUserRoleById(state, userId));

  const [loading, setLoading] = useState(false);

  const [isEdit, setIsEdit] = useState(false);
  const [isDelete, setIsDelete] = useState(false);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(true);
      await dispatch(userGetById(userId)).unwrap();
      setLoading(false);
    }
  }, [userId, user, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const userRoleFormatted = useMemo(() => userRole.reduce((s, role) => {
    role = role.charAt(0).toUpperCase() + role.slice(1);
    return s ? `${s}, ${role}` : role;
  }, ""), [userRole]);

  const InfoModal = () => (
    <>
      <div className="d-flex justify-content-between">
        <small className="text-secondary ps-3 my-auto">ID: {user.id}</small>
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
      <CModalBody>
        <p>Email: {user.email}</p>
        <p>Status: <span
          className={
            user.status === "active"
              ? "text-success"
              : user.status === "terminated"
                ? "text-danger"
                : "text-warning"
          }>
          {user.status}
        </span>
        </p>
        <p>
          Role: {userRoleFormatted}
        </p>
        <p>Registered on: {new Date(user.created_at).toLocaleString("en-US")}</p>
      </CModalBody>
    </>
  );

  const EditModal = () => {
    const initialInput = { name: "", status: "" };
    const [input, setInput] = useState(initialInput);

    useEffect(() => {
      if (user) {
        setInput({
          name: user.name,
          status: user.status,
        });
      }
    }, []);

    const handleInputChanged = ({ target }) => {
      const { name, value } = target;
      setInput({ ...input, [name]: value });
    };

    const handleSave = () => {
      if (!input.name || !input.status) {
        return;
      }
      const userData = {
        id: user.id,
        name: input.name,
        status: input.status,
      };
      dispatch(userUpdateById(userData))
      setIsEdit(false);
    };

    return (
      <CModalBody>
        <CForm>
          <label htmlFor="userName">Name</label>
          <CFormInput
            className="mb-3 shadow-none"
            id="userName"
            name="name"
            type="text"
            placeholder="Name"
            value={input.name}
            onChange={handleInputChanged}
          />
          <label htmlFor="userStatus">Status</label>
          <CFormSelect
            className="mb-3 shadow-none"
            id="userStatus"
            name="status"
            options={[
              { label: "active", value: "active" },
              { label: "blocked", value: "blocked" },
              { label: "terminated", value: "terminated" },
            ]}
            value={input.status}
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
        </CForm>
      </CModalBody>
    );
  };

  const DeleteModal = () => {
    const [email, setEmail] = useState("");
    const [inputEmail, setInputEmail] = useState("");

    useEffect(() => {
      if (user) {
        setEmail(user.email);
      }
    }, []);

    const handleDelete = () => {
      if (email !== inputEmail) {
        return;
      }
      dispatch(userDeleteById(user.id));
      onClose();
    };

    return (
      <CModalBody>
        <CForm>
          <label htmlFor="userName">Type "{email}" to delete user</label>
          <CFormInput
            className="mb-3 shadow-none"
            id="userName"
            name="email"
            type="text"
            placeholder="Confirmation"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
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
              disabled={email !== inputEmail}
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
            {user.name}
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

export default UserDetailsModal;
