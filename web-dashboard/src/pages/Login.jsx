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
  CCardGroup,
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
  authLogin,
  authStateSet,
  selectAuthAuthenticated,
  selectAuthSecureStorage,
} from "redux/auth/authSlice";

const Login = () => {
  const authenticated = useSelector(selectAuthAuthenticated);
  const token = useSelector(selectAuthSecureStorage);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [input, setInput] = useState({
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
    const { email, password, role } = input;
    if (!email || !password || !role) {
      return;
    }
    dispatch(authLogin({ email, password, role }));
  };
  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm>
                    <h1>Login</h1>
                    <p className="text-medium-emphasis">Sign In to your account</p>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Username"
                        autoComplete="username"
                        name="email"
                        value={input.email}
                        onChange={handleInputChanged}
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
                        autoComplete="current-password"
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
                            .map(([label, value]) => ({ label, value })),
                        ]}
                        name="role"
                        value={input.role}
                        onChange={handleInputChanged}
                      />
                    </CInputGroup>
                    <CButton
                      color="primary"
                      className="w-100 px-4"
                      onClick={handleSubmit}
                    >
                      Login
                    </CButton>
                  </CForm>
                </CCardBody>
              </CCard>
              <CCard className="text-white bg-primary py-5" >
                <CCardBody className="text-center">
                  <div>
                    <h2>Sign up</h2>
                    <p>
                      If you don{"'"}t have an account.
                    </p>
                    <Link to="/register">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
                        Register here!
                      </CButton>
                    </Link>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div >
  )
}

export default Login;
