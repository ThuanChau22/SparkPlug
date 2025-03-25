import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";

import Header from "components/Header";
import Sidebar from "components/Sidebar";
import Footer from "components/Footer";
import ErrorToast from "components/ErrorToast";
import LoadingIndicator from "components/LoadingIndicator";
import useTheme from "hooks/useTheme";
import { clearHeader } from "redux/api";
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

  useTheme();

  useEffect(() => {
    if (token) {
      dispatch(authStateSet({ token }));
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (authenticated && expiredTime <= Date.now()) {
      dispatch(authStateClear());
      clearHeader();
    }
  }, [authenticated, expiredTime, dispatch]);

  useEffect(() => {
    if (!authenticated && !token) {
      navigate(routes.Login.path, { replace: true });
    }
  }, [authenticated, token, navigate]);

  useEffect(() => {
    const options = { replace: true };
    const path = location.pathname.split("/");
    if (path.length < 2) return;

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
  }, [authIsAdmin, authIsOwner, authIsDriver, location, navigate]);

  useEffect(() => {
    const restricted = new Set();
    if (authIsAdmin || authIsOwner) {
      restricted.add(routes.Driver.Components.Dashboard.path);
      restricted.add(routes.Driver.Components.Stations.path);
      if (authIsOwner) {
        restricted.add(routes.Users.path);
      }
    }
    if (authIsDriver) {
      restricted.add(routes.Dashboard.path);
      restricted.add(routes.Stations.Components.Management.path);
      restricted.add(routes.Stations.Components.Monitor.path);
      restricted.add(routes.Stations.Components.Analytics.path);
      restricted.add(routes.Sites.path);
      restricted.add(routes.Users.path);
      restricted.add(routes.StationPrediction.path);
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

  return (
    <div className="min-vh-100 d-flex flex-row align-items-center">
      <ErrorToast />
      {!authenticated
        ? <LoadingIndicator loading={!authenticated} />
        : (
          <>
            <Sidebar />
            <div className={`min-vh-100 d-flex flex-column wrapper`}>
              <Header />
              <div className="body d-flex flex-column flex-grow-1">
                <Outlet />
              </div>
              <Footer />
            </div>
          </>
        )
      }
    </div>
  );
};

export default App;
