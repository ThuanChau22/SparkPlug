import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
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
  CButton,
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
import {
  FormatListBulletedOutlined,
  MapOutlined,
} from "@mui/icons-material";

import logoBrand from "assets/logo-brand";
import Breadcrumb from "components/Breadcrumb";
import HeaderDropdown from "components/HeaderDropdown";
import useWindowResize from "hooks/useWindowResize";
import {
  LayoutView,
  layoutStateSetHeaderActive,
  layoutStateSetHeaderHeight,
  layoutStateSetSidebarShow,
  layoutStateSetView,
  selectLayoutMobile,
  selectLayoutSidebarShow,
  selectLayoutView,
} from "redux/app/layoutSlice";
import routes from "routes";
import "scss/style.scss";

const Header = () => {
  const headerRef = useRef({});

  const isMobile = useSelector(selectLayoutMobile);
  const sidebarShow = useSelector(selectLayoutSidebarShow);
  const layoutView = useSelector(selectLayoutView);

  const [components, setComponents] = useState([]);

  const location = useLocation();

  const dispatch = useDispatch();

  useWindowResize(useCallback(() => {
    const headerHeight = headerRef.current?.offsetHeight;
    dispatch(layoutStateSetHeaderHeight(headerHeight));
  }, [dispatch]));

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

  const showViewButton = useMemo(() => {
    const hasPath = new Set([
      routes.Sites.path,
      routes.Stations.Components.Management.path,
      routes.Stations.Components.Monitor.path,
      routes.Stations.Components.Analytics.path,
      routes.Driver.Components.Stations.path,
    ]).has(location.pathname.replace(/\/$/, ""));
    return isMobile && hasPath;
  }, [location, isMobile]);

  return (
    <CHeader ref={headerRef} position="sticky" className="p-0">
      <CContainer className={`${isMobile ? "" : "border-bottom"}`} fluid>
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
            {components.map(({ name, path }, index) => (
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
      <CContainer className="d-none d-md-flex" fluid>
        <Breadcrumb />
      </CContainer>
      {showViewButton && (
        <div
          className="position-absolute bottom-0 end-0"
          style={{ transform: "translateY(100%)" }}
        >
          <CButton
            className="bg-body mt-2 me-3"
            onClick={() => {
              dispatch(layoutStateSetView(
                layoutView === LayoutView.List
                  ? LayoutView.Map
                  : LayoutView.List
              ));
            }}
          >
            {layoutView === LayoutView.List
              ? <FormatListBulletedOutlined fontSize="small" />
              : <MapOutlined fontSize="small" />
            }
          </CButton>
        </div>
      )}
    </CHeader >
  );
};

export default Header;

