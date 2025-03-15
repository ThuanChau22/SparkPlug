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
  CRow,
} from "@coreui/react";
import {
  EmailOutlined,
  LockOutlined,
  PeopleOutlined,
} from "@mui/icons-material";

import ErrorToast from "components/ErrorToast";
import FormInput from "components/FormInput";
import LoadingIndicator from "components/LoadingIndicator";
import useTheme from "hooks/useTheme";
import {
  AuthRoles,
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

  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState({
    email: "",
    password: "",
    role: "",
  });

  useTheme();

  useEffect(() => {
    if (token) {
      dispatch(authStateSet({ token }));
    }
  }, [dispatch, token]);

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
    const { email, password, role } = input;
    if (!email || !password || !role) {
      setValidated(true);
      return;
    }
    setLoading(true);
    const params = { email, password, role };
    await dispatch(authLogin(params)).unwrap();
    setLoading(false);
  };

  return (
    <div className="min-vh-100 d-flex flex-row align-items-center">
      <ErrorToast />
      <CContainer>
        <LoadingIndicator loading={loading} overlay={true} />
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm noValidate validated={validated}>
                    <h1>Login</h1>
                    <p className="text-medium-emphasis">Sign In to your account</p>
                    <FormInput
                      name="email"
                      Icon={EmailOutlined}
                      InputForm={CFormInput}
                      type="text"
                      placeholder="Email"
                      value={input.email}
                      onChange={handleInputChange}
                      feedbackInvalid="Please provide email"
                      required
                    />
                    <FormInput
                      name="password"
                      Icon={LockOutlined}
                      InputForm={CFormInput}
                      type="password"
                      placeholder="Password"
                      value={input.password}
                      onChange={handleInputChange}
                      feedbackInvalid="Please provide password"
                      required
                    />
                    <FormInput
                      name="role"
                      Icon={PeopleOutlined}
                      InputForm={CFormSelect}
                      options={[
                        { label: "Select Role", value: "", disabled: true },
                        ...Object.entries(AuthRoles).map(([label, value]) => ({ label, value })),
                      ]}
                      value={input.role}
                      onChange={handleInputChange}
                      feedbackInvalid="Please select a role"
                      required
                    />
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
                      If you do not have an account.
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
    </div>
  )
}

export default Login;
