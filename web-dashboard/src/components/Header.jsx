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
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  useColorModes,
  CHeaderBrand,
  CHeaderDivider,
} from "@coreui/react";
import {
  cilContrast,
  cilMenu,
  cilMoon,
  cilSun,
} from '@coreui/icons'
import CIcon from "@coreui/icons-react";
import logoBrand from "assets/logo-brand";
import Breadcrumb from "components/Breadcrumb";
import HeaderDropdown from "components/HeaderDropdown";
import {
  headerSetActive,
  headerSetHeight,
} from "redux/header/headerSlice";
import {
  selectSidebarShow,
  sidebarSetShow,
} from "redux/sidebar/sidebarSlice";
import routes from "routes";
import '../scss/style.scss';

const Header = () => {
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
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
    setComponents([]);
    const paths = location.pathname.split("/");
    if (paths.length >= 3) {
      const [, resource, component] = paths;
      for (const { path, Components } of Object.values(routes)) {
        if (path === `/${resource}` && Components) {
          setComponents(Object.values(Components));
          for (const { name, path } of Object.values(Components)) {
            if (path === `/${resource}/${component}`) {
              dispatch(headerSetActive(name));
            }
          }
        }
      }
    }
  }, [location, dispatch]);


  return (
    <CHeader position="sticky" ref={ref} style={{ zIndex: 1000 }}>
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
              <CNavLink to={path} as={NavLink}>
                {name}
              </CNavLink>
            </CNavItem>
          ))}
        </CHeaderNav>
        <CHeaderNav>
          <HeaderDropdown />
        </CHeaderNav>
        <CHeaderNav>
          <CDropdown variant="nav-item" placement="bottom-end" style={{ position: 'relative', zIndex: 1100 }}>
            <CDropdownToggle caret={false}  style={{ zIndex: 1200 }}>
              {colorMode === 'dark' ? (
                <CIcon icon={cilMoon} size="lg" />
              ) : colorMode === 'auto' ? (
                <CIcon icon={cilContrast} size="lg" />
              ) : (
                <CIcon icon={cilSun} size="lg" />
              )}
            </CDropdownToggle>
            <CDropdownMenu style={{ zIndex: 1200 }}>
              <CDropdownItem
                active={colorMode === 'light'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                style={{ zIndex: 1200 }}
                onClick={() => setColorMode('light')}
              >
                <CIcon className="me-2" style={{ zIndex: 1200 }} icon={cilSun} size="lg" /> Light
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'dark'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                style={{ zIndex: 1200 }}
                onClick={() => setColorMode('dark')}
              >
                <CIcon className="me-2" style={{ zIndex: 1200 }} icon={cilMoon} size="lg" /> Dark
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'auto'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                style={{ zIndex: 1200 }}
                onClick={() => setColorMode('auto')}
              >
                <CIcon className="me-2" style={{ zIndex: 1200 }} icon={cilContrast} size="lg" /> Auto
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </CHeaderNav>
      </CContainer>
      <CHeaderDivider />
      <CContainer fluid>
        <Breadcrumb />
      </CContainer>
    </CHeader>
  );
};

export default Header;

