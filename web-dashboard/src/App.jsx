import { useEffect } from "react";
import { useSelector } from "react-redux";
import {
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";

import Footer from "components/Footer";
import Header from "redux/header/Header";
import Sidebar from "redux/sidebar/Sidebar";
import { selectAuthAuthenticated } from "redux/auth/authSlice";
import routes from "routes";

const App = () => {
  const authenticated = useSelector(selectAuthAuthenticated);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const options = { replace: true };
    if (!authenticated) {
      navigate(routes.Login.path, options);
      return;
    }
    const paths = location.pathname.split("/");
    if (paths.length >= 2) {
      const [, resource, component] = paths;
      if (!resource) {
        navigate(routes.Root.defaultPath, options);
        return;
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
  }, [authenticated, location, navigate]);
  return (
    <>
      <Sidebar />
      <div className="wrapper d-flex flex-column min-vh-100 bg-light">
        <Header />
        <div className="body flex-grow-1 px-3">
          <Outlet />
        </div>
        <Footer />
      </div>
    </>
  );
};

export default App;