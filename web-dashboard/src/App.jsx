import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GooeyCircleLoader } from "react-loaders-kit";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { CContainer } from "@coreui/react";
import Header from "components/Header";
import Sidebar from "components/Sidebar";
import Footer from "components/Footer";
import {
  authStateSet,
  authStateClear,
  selectAuthAuthenticated,
  selectAuthRoleIsStaff,
  selectAuthRoleIsOwner,
  selectAuthRoleIsDriver,
  selectAuthExpiredTime,
  selectAuthSecureStorage,
} from "redux/auth/authSlice";
import routes from "routes";
import './scss/style.scss'; // 确保路径正确

const App = () => {
  const authenticated = useSelector(selectAuthAuthenticated);
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const authIsOwner = useSelector(selectAuthRoleIsOwner);
  const authIsDriver = useSelector(selectAuthRoleIsDriver);
  const expiredTime = useSelector(selectAuthExpiredTime);
  const token = useSelector(selectAuthSecureStorage);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [theme, setTheme] = useState('light'); // State for theme

  useEffect(() => {
    if (token) {
      dispatch(authStateSet({ token }));
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (authenticated && expiredTime <= Date.now()) {
      dispatch(authStateClear());
    }
  }, [authenticated, expiredTime, dispatch]);

  useEffect(() => {
    const options = { replace: true };
    if (!authenticated && !token) {
      navigate(routes.Login.path, options);
      return;
    }
    const path = location.pathname.split("/");
    if (path.length >= 2) {
      const [, resource, component] = path;
      if (!resource) {
        if (authIsAdmin || authIsOwner) {
          navigate(routes.Dashboard.path, options);
          return;
        }
        if (authIsDriver) {
          navigate(routes.Driver.defaultPath, options);
          return;
        }
      }
      if (!component) {
        for (const { path, defaultPath } of Object.values(routes)) {
          if (path === `/${resource}` && defaultPath) {
            navigate(defaultPath, options);
            return;
          }
        }
      }
    }
  }, [authenticated, authIsAdmin, authIsOwner, authIsDriver, token, location, navigate]);

  useEffect(() => {
    const restricted = new Set();
    if (authIsAdmin || authIsOwner) {
      restricted.add(routes.Driver.Components.Dashboard.path);
      restricted.add(routes.Driver.Components.Stations.path);
      if (authIsOwner) {
        restricted.add(routes.Users.path);
      }
      restricted.add(routes.Driver.Components.AIPredictedLocation.path)
    }
    if (authIsDriver) {
      restricted.add(routes.Dashboard.path);
      restricted.add(routes.Stations.Components.Management.path);
      restricted.add(routes.Stations.Components.Monitor.path);
      restricted.add(routes.Stations.Components.Analytics.path);
      restricted.add(routes.Sites.path);
      restricted.add(routes.Users.path);
      restricted.add(routes.AIPredictedLocation.path);
    }
    let path = location.pathname;
    if (path.charAt(path.length - 1) === "/") {
      path = path.substring(0, path.length - 1);
    }
    if (restricted.has(path)) {
      navigate(routes.Unauthorized.path, { replace: true });
      return;
    }
  }, [authIsAdmin, authIsOwner, authIsDriver, location, navigate]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    document.body.className = theme; // Apply theme class to body
  }, [theme]);

  return (
    authenticated ? (
      <>
        <Sidebar />
        <div className={`min-vh-100 d-flex flex-column wrapper ${theme}`}>
          <Header theme={theme} toggleTheme={toggleTheme} /> {/* Passing theme and toggleTheme as props */}
          <div className="body flex-grow-1">
            <Outlet context={{ theme, toggleTheme }} /> {/* Passing theme and toggleTheme to Outlet context */}
          </div>
          <Footer />
        </div>
      </>
    ) : (
      <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
        <CContainer className="d-flex flex-row justify-content-center">
          <GooeyCircleLoader
            className="mx-auto"
            color={["#f6b93b", "#5e22f0", "#ef5777"]}
            loading={true}
          />
        </CContainer>
      </div>
    )
  );
};

export default App;
