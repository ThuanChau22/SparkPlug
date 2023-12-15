import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import {
  CContainer,
} from "@coreui/react";
import { GooeyCircleLoader } from "react-loaders-kit";

import Footer from "components/Footer";
import Header from "redux/header/Header";
import Sidebar from "redux/sidebar/Sidebar";
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
          navigate(routes.Root.defaultPath, options);
          return;
        }
        if (authIsDriver) {
          navigate(routes.Drivers.path, options);
          return;
        }
      }
      if (!component) {
        for (const { path, defaultPath } of Object.values(routes.Resources)) {
          if (path === `/${resource}`) {
            navigate(defaultPath, options);
            return;
          }
        }
      }

    }
  }, [authenticated, authIsAdmin, authIsOwner, authIsDriver, token, location, navigate]);

  useEffect(() => {
    const restricted = new Set();
    if (authIsOwner) {
      restricted.add(routes.Resources.Users.Components.Management.path);
      // restricted.add(routes.Resources.Users.Components.Analytics.path);
    }
    if (authIsDriver) {
      restricted.add(routes.Resources.Sites.Components.Management.path);
      // restricted.add(routes.Resources.Sites.Components.Monitor.path);
      restricted.add(routes.Resources.Sites.Components.Analytics.path);
      restricted.add(routes.Resources.Stations.Components.Management.path);
      restricted.add(routes.Resources.Stations.Components.Monitor.path);
      restricted.add(routes.Resources.Stations.Components.Analytics.path);
      restricted.add(routes.Resources.Users.Components.Management.path);
      // restricted.add(routes.Resources.Users.Components.Analytics.path);
      // restricted.add(routes.Resources.Transactions.path);
    }
    let path = location.pathname;
    if (path.charAt(path.length - 1) === "/") {
      path = path.substring(0, path.length - 1);
    }
    if (restricted.has(path)) {
      navigate(routes.Unauthorized.path, { replace: true });
      return;
    }
  }, [authIsOwner, authIsDriver, location, navigate]);

  return (authenticated
    ? (
      <>
        <Sidebar />
        <div className="wrapper d-flex flex-column min-vh-100 bg-light">
          <Header />
          <div className="body flex-grow-1 px-3 pb-5">
            <Outlet />
          </div>
          <Footer />
        </div>
      </>)
    : (
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
