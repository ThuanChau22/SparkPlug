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
  CHeaderNav,
  CHeaderToggler,
  CNav,
  CNavLink,
  CNavItem,
  CHeaderBrand,
} from "@coreui/react";
import {
  cilMenu,
} from "@coreui/icons"
import CIcon from "@coreui/icons-react";

import logoBrand from "assets/logo-brand";
import Breadcrumb from "components/Breadcrumb";
import HeaderDropdown from "components/HeaderDropdown";
import {
  selectLayoutSidebarShow,
  layoutStateSetHeaderActive,
  layoutStateSetHeaderHeight,
  layoutStateSetSidebarShow,
} from "redux/layout/layoutSlice";
import routes from "routes";
import "scss/style.scss";

const Header = () => {
  const headerRef = useRef({});

  const sidebarShow = useSelector(selectLayoutSidebarShow);

  const [components, setComponents] = useState([]);

  const location = useLocation();

  const dispatch = useDispatch();

  const handleResize = useCallback(() => {
    dispatch(layoutStateSetHeaderHeight(headerRef.current.offsetHeight));
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
    setComponents([]);
    const paths = location.pathname.split("/");
    if (paths.length >= 3) {
      const [, resource, component] = paths;
      for (const { path, Components } of Object.values(routes)) {
        if (path === `/${resource}` && Components) {
          setComponents(Object.values(Components));
          for (const { name, path } of Object.values(Components)) {
            if (path === `/${resource}/${component}`) {
              dispatch(layoutStateSetHeaderActive(name));
            }
          }
        }
      }
    }
  }, [location, dispatch]);

  return (
    <CHeader ref={headerRef} position="sticky" className="p-0">
      <CContainer className="border-bottom" fluid>
        <CHeaderToggler
          className="ps-1"
          onClick={() => dispatch(layoutStateSetSidebarShow(!sidebarShow))}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderBrand className="d-md-none mx-auto">
          <CIcon icon={logoBrand} height={30} alt="Logo" />
        </CHeaderBrand>
        <CHeaderNav className="d-none d-md-flex me-auto" >
          <CNav layout="fill">
            {components && components.map(({ name, path }, index) => (
              <CNavItem key={index}>
                <CNavLink to={path} as={NavLink}>
                  {name}
                </CNavLink>
              </CNavItem>
            ))}
          </CNav>
        </CHeaderNav>
        <CHeaderNav className="d-flex align-items-center">
          <HeaderDropdown />
        </CHeaderNav>
      </CContainer >
      <CContainer fluid>
        <Breadcrumb />
      </CContainer>
    </CHeader >
  );
};

export default Header;

