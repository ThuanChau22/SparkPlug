import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useNavigate,
  Link,
} from "react-router-dom";
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilGroup, cilLockLocked, cilUser } from "@coreui/icons";

import {
  Roles,
  authSignup,
  authStateSet,
  selectAuthAuthenticated,
  selectAuthSecureStorage,
} from "redux/auth/authSlice";

const Register = () => {
  const authenticated = useSelector(selectAuthAuthenticated);
  const token = useSelector(selectAuthSecureStorage);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [input, setInput] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  useEffect(() => {
    if (token) {
      dispatch(authStateSet({ token }));
    }
  }, [token]);
  useEffect(() => {
    if (authenticated) {
      navigate("/", { replace: true });
    }
  }, [authenticated, navigate]);
  const handleInputChanged = ({ target }) => {
    const { name, value } = target;
    setInput({ ...input, [name]: value });
  };
  const handleSubmit = () => {
    const { name, email, password, role } = input;
    if (!role) {
      return;
    }
    dispatch(authSignup({ name, email, password, role }));
  };
  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={9} lg={7} xl={6}>
            <CCard className="mx-4">
              <CCardBody className="p-4">
                <CForm>
                  <h1>Register</h1>
                  <p className="text-medium-emphasis">Create your account</p>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Username"
                      autoComplete="username"
                      name="name"
                      value={input.name}
                      onChange={handleInputChanged}
                    />
                  </CInputGroup>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>@</CInputGroupText>
                    <CFormInput
                      placeholder="Email"
                      autoComplete="email"
                      name="email"
                      value={input.email}
                      onChange={handleInputChanged}
                    />
                  </CInputGroup>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Password"
                      autoComplete="new-password"
                      name="password"
                      value={input.password}
                      onChange={handleInputChanged}
                    />
                  </CInputGroup>
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilGroup} />
                    </CInputGroupText>
                    <CFormSelect
                      options={[
                        { label: "Select Role" },
                        ...Object.entries(Roles)
                          .filter(([_, value]) => value !== Roles.Staff)
                          .map(([label, value]) => ({ label, value })),
                      ]}
                      name="role"
                      value={input.role}
                      onChange={handleInputChanged}
                    />
                  </CInputGroup>
                  <div className="d-grid">
                    <CButton
                      color="success"
                      onClick={handleSubmit}
                    >
                      Create Account
                    </CButton>
                  </div>
                </CForm>
                <div className="text-center pt-4">
                  <Link to="/login">
                    Back to Signin
                  </Link>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Register;
