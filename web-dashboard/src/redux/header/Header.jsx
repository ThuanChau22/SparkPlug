import {
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import {
  useLocation,
  NavLink,
} from "react-router-dom";
import {
  CContainer,
  CHeader,
  CHeaderBrand,
  CHeaderDivider,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
} from "@coreui/react";
import { cilMenu } from "@coreui/icons";
import CIcon from "@coreui/icons-react";

import logoBrand from "assets/logo-brand";
import Breadcrumb from "components/Breadcrumb";
import HeaderDropdown from "components/HeaderDropdown";
import {
  headerSetActive,
  headerSetHeight,
} from "./headerSlice";
import {
  selectSidebarShow,
  sidebarSetShow,
} from "redux/sidebar/sidebarSlice";
import routes from "routes";

const Header = () => {
  const sidebarShow = useSelector(selectSidebarShow);
  const [components, setComponents] = useState([]);
  const ref = useRef(0);
  const location = useLocation();
  const dispatch = useDispatch();

  const handleResize = useCallback(() => {
    dispatch(headerSetHeight(ref.current.offsetHeight));
  }, [dispatch]);

  useEffect(() => {
    handleResize();
    window.addEventListener("load", handleResize);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("load", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  useEffect(() => {
    const paths = location.pathname.split("/");
    if (paths.length >= 3) {
      const [, resource, component] = paths;
      for (const { path, Components } of Object.values(routes.Resources)) {
        if (path === `/${resource}`) {
          setComponents(Object.values(Components));
        }
        for (const { name, path } of Object.values(Components)) {
          if (path === `/${resource}/${component}`) {
            dispatch(headerSetActive(name));
          }
        }
      }
    }
  }, [location, dispatch]);
  return (
    <CHeader position="sticky" ref={ref}>
      <CContainer fluid>
        <CHeaderToggler
          className="ps-1"
          onClick={() => dispatch(sidebarSetShow(!sidebarShow))}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderBrand className="d-md-none mx-auto">
          <CIcon icon={logoBrand} height={20} alt="Logo" />
        </CHeaderBrand>
        <CHeaderNav className="d-none d-md-flex me-auto">
          {components && components.map(({ name, path }, index) => (
            <CNavItem key={index}>
              <CNavLink to={path} component={NavLink}>
                {name}
              </CNavLink>
            </CNavItem>
          ))}
        </CHeaderNav>
        <CHeaderNav>
          <HeaderDropdown />
        </CHeaderNav>
      </CContainer>
      <CHeaderDivider />
      <CContainer fluid>
        <Breadcrumb />
      </CContainer>
    </CHeader>
  )
};

export default Header
