import {
  useEffect,
  useState,
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
import {
  // cilBell,
  cilMenu,
} from "@coreui/icons";
import CIcon from "@coreui/icons-react";

import Breadcrumb from "components/Breadcrumb";
import HeaderDropdown from "components/HeaderDropdown";
import {
  headerSetActive,
} from "./headerSlice";
import {
  selectSidebarShow,
  sidebarSetShow,
} from "redux/sidebar/sidebarSlice";
import routes from "routes";

const Header = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const sidebarShow = useSelector(selectSidebarShow);
  const [components, setComponents] = useState([]);
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
    <CHeader position="sticky" className="mb-4">
      <CContainer fluid>
        <CHeaderToggler
          className="ps-1"
          onClick={() => dispatch(sidebarSetShow(!sidebarShow))}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderBrand className="mx-auto d-md-none" to="/">
          <CIcon icon="logo" height={48} alt="Logo" />
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
        <CHeaderNav className="ms-3">
          <HeaderDropdown />
        </CHeaderNav>
      </CContainer>
      <CHeaderDivider />
      <CContainer fluid>
        <Breadcrumb />
      </CContainer>
    </CHeader>
  )
}

export default Header
