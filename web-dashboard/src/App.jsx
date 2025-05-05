import { useCallback, useEffect } from "react";
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
import useWindowResize from "hooks/useWindowResize";
import { clearHeader } from "redux/api";
import {
  layoutStateSetMobile,
} from "redux/app/layoutSlice";
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

  useWindowResize(useCallback(() => {
    const medium = "only screen and (min-width: 768px)";
    dispatch(layoutStateSetMobile(!window.matchMedia(medium).matches));
  }, [dispatch]));

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
    const options = { replace: true };

    // Navigate on unauthenticated
    if (!authenticated && !token) {
      navigate(routes.Login.path, options);
    }

    // Navigate with restriction
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
    if (restricted.has(location.pathname.replace(/\/$/, ""))) {
      navigate(routes.Unauthorized.path, { replace: true });
      return;
    }

    // Navigate resource components
    const path = location.pathname.split("/") || [];
    const [_, resource, component] = path;
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
  }, [authenticated, token, authIsAdmin, authIsOwner, authIsDriver, location, navigate]);

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
