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
import FormInputPassword from "components/FormInputPassword";
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
                    InputForm={CFormInput}
                    className="mb-3"
                    icon={<PersonOutlined />}
                    type="text"
                    name="name"
                    placeholder="Username"
                    value={input.name}
                    feedbackInvalid="Please provide username"
                    onChange={handleInputChange}
                    required
                  />
                  <FormInput
                    InputForm={CFormInput}
                    className="mb-3"
                    icon={<EmailOutlined />}
                    type="text"
                    name="email"
                    placeholder="Email"
                    value={input.email}
                    onChange={handleInputChange}
                    feedbackInvalid="Please provide email"
                    required
                  />
                  <FormInputPassword
                    InputForm={CFormInput}
                    className="mb-3"
                    icon={<LockOutlined />}
                    name="password"
                    placeholder="Password"
                    value={input.password}
                    onChange={handleInputChange}
                    feedbackInvalid="Please provide password"
                    required
                  />
                  <FormInput
                    InputForm={CFormSelect}
                    className="mb-3"
                    icon={<PeopleOutlined />}
                    name="role"
                    options={[
                      { label: "Select Role", value: "", disabled: true },
                      ...Object.entries(AuthRoles)
                        .filter(([, value]) => value !== AuthRoles.Staff)
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
