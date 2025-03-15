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
  CRow,
} from "@coreui/react";
import {
  LockOutlined,
  EmailOutlined,
  PersonOutlined,
  PeopleOutlined,
} from "@mui/icons-material";

import ErrorToast from "components/ErrorToast";
import FormInput from "components/FormInput";
import LoadingIndicator from "components/LoadingIndicator";
import useTheme from "hooks/useTheme";
import {
  AuthRoles,
  authSignup,
  authStateSet,
  selectAuthAuthenticated,
  selectAuthSecureStorage,
} from "redux/auth/authSlice";

const Register = () => {
  const authenticated = useSelector(selectAuthAuthenticated);
  const token = useSelector(selectAuthSecureStorage);

  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useTheme();

  useEffect(() => {
    if (token) {
      dispatch(authStateSet({ token }));
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (authenticated) {
      navigate("/", { replace: true });
    }
  }, [authenticated, navigate]);

  const handleInputChange = ({ target }) => {
    const { name, value } = target;
    setInput({ ...input, [name]: value });
  };

  const handleSubmit = async () => {
    const { name, email, password, role } = input;
    if (!name || !email || !password || !role) {
      setValidated(true);
      return;
    }
    setLoading(true);
    const params = { name, email, password, role };
    await dispatch(authSignup(params)).unwrap();
    setLoading(false);
  };

  return (
    <div className="min-vh-100 d-flex flex-row align-items-center">
      <ErrorToast />
      <CContainer>
        <LoadingIndicator loading={loading} overlay={true} />
        <CRow className="justify-content-center">
          <CCol md={9} lg={7} xl={6}>
            <CCard className="mx-4">
              <CCardBody className="p-4">
                <CForm noValidate validated={validated}>
                  <h1>Register</h1>
                  <p className="text-medium-emphasis">Create your account</p>
                  <FormInput
                    Icon={PersonOutlined}
                    InputForm={CFormInput}
                    name="name"
                    type="text"
                    placeholder="Username"
                    value={input.name}
                    feedbackInvalid="Please provide username"
                    onChange={handleInputChange}
                    required
                  />
                  <FormInput
                    Icon={EmailOutlined}
                    InputForm={CFormInput}
                    name="email"
                    type="text"
                    placeholder="Email"
                    value={input.email}
                    onChange={handleInputChange}
                    feedbackInvalid="Please provide email"
                    required
                  />
                  <FormInput
                    Icon={LockOutlined}
                    InputForm={CFormInput}
                    name="password"
                    placeholder="Password"
                    type="password"
                    value={input.password}
                    onChange={handleInputChange}
                    feedbackInvalid="Please provide password"
                    required
                  />
                  <FormInput
                    Icon={PeopleOutlined}
                    InputForm={CFormSelect}
                    name="role"
                    options={[
                      { label: "Select Role", value: "", disabled: true },
                      ...Object.entries(AuthRoles)
                        .filter(([_, value]) => value !== AuthRoles.Staff)
                        .map(([label, value]) => ({ label, value })),
                    ]}
                    value={input.role}
                    onChange={handleInputChange}
                    feedbackInvalid="Please select a role"
                    required
                  />
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
