import { useEffect, useState } from "react";
import {
  useSelector,
  useDispatch,
} from "react-redux";
import {
  NavLink,
  useLocation,
} from "react-router-dom";
import {
  CNavItem,
  CNavTitle,
  CNavGroup,
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CSidebarToggler,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  AccountTreeOutlined,
  EvStationOutlined,
  GroupsOutlined,
  // ReceiptLongOutlined,
} from '@mui/icons-material';

import logo from "assets/logo";
import logoBrand from "assets/logo-brand";
import routes from "routes";
import {
  selectAuthRoleIsStaff,
  selectAuthRoleIsOwner,
  selectAuthRoleIsDriver,
} from "redux/auth/authSlice";
import {
  selectHeaderActive,
} from "redux/header/headerSlice";
import {
  selectSidebarShow,
  selectSidebarFold,
  sidebarSetShow,
  sidebarSetFold,
} from "redux/sidebar/sidebarSlice";

const Sidebar = () => {
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const authIsOwner = useSelector(selectAuthRoleIsOwner);
  const authIsDriver = useSelector(selectAuthRoleIsDriver);
  const headerActive = useSelector(selectHeaderActive);
  const unfoldable = useSelector(selectSidebarFold);
  const sidebarShow = useSelector(selectSidebarShow);
  const [navigation, setNavigation] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleResize = () => {
      const medium = "only screen and (min-width: 768px)";
      setIsMobile(!window.matchMedia(medium).matches);
      const extraLarge = "only screen and (min-width: 1200px)";
      if (!window.matchMedia(extraLarge).matches) {
        dispatch(sidebarSetFold(true));
      }
    };
    handleResize();
    window.addEventListener("load", handleResize);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("load", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, [dispatch]);

  useEffect(() => {
    const newNavigation = [
      {
        component: CNavTitle,
        name: "Resources",
      },
    ];
    const {
      Sites,
      Stations,
      Users,
      // Transactions,
    } = routes.Resources;
    if (authIsAdmin || authIsOwner) {
      newNavigation.push({
        component: isMobile ? CNavGroup : CNavItem,
        name: Sites.name,
        to: Sites.Components[headerActive]?.path || Sites.defaultPath,
        icon: <AccountTreeOutlined className="nav-icon" />,
        items: !isMobile ? undefined : [
          {
            component: CNavItem,
            name: Sites.Components.Management.name,
            to: Sites.Components.Management.path,
          },
          // {
          //   component: CNavItem,
          //   name: Sites.Components.Monitor.name,
          //   to: Sites.Components.Monitor.path,
          // },
          {
            component: CNavItem,
            name: Sites.Components.Analytics.name,
            to: Sites.Components.Analytics.path,
          },
        ],
      });
      newNavigation.push({
        component: isMobile ? CNavGroup : CNavItem,
        name: Stations.name,
        to: Stations.Components[headerActive]?.path || Stations.defaultPath,
        icon: <EvStationOutlined className="nav-icon" />,
        items: !isMobile ? undefined : [
          {
            component: CNavItem,
            name: Stations.Components.Management.name,
            to: Stations.Components.Management.path,
          },
          {
            component: CNavItem,
            name: Stations.Components.Monitor.name,
            to: Stations.Components.Monitor.path,
          },
          {
            component: CNavItem,
            name: Stations.Components.Analytics.name,
            to: Stations.Components.Analytics.path,
          },
        ],
      });
      if (authIsAdmin) {
        newNavigation.push({
          component: isMobile ? CNavGroup : CNavItem,
          name: Users.name,
          to: Users.Components[headerActive]?.path || Users.defaultPath,
          icon: <GroupsOutlined className="nav-icon" />,
          items: !isMobile ? undefined : [
            {
              component: CNavItem,
              name: Users.Components.Management.name,
              to: Users.Components.Management.path,
            },
            // {
            //   component: CNavItem,
            //   name: Users.Components.Analytics.name,
            //   to: Users.Components.Analytics.path,
            // },
          ],
        });
      }
    }
    if (authIsDriver) {
      newNavigation.push({
        component: CNavItem,
        name: routes.Drivers.name,
        to: routes.Drivers.path,
        icon: <EvStationOutlined className="nav-icon" />,
      });
    }
    // newNavigation.push({
    //   component: CNavItem,
    //   name: Transactions.name,
    //   to: Transactions.Components[headerActive]?.path || Transactions.defaultPath,
    //   icon: <ReceiptLongOutlined className="nav-icon" />,
    // });
    setNavigation(newNavigation);
  }, [authIsAdmin, authIsOwner, authIsDriver, headerActive, isMobile]);

  const SidebarNav = ({ items }) => {
    const NavGroup = ({ component: Component, name, icon, to, items, ...rest }, index) => (
      <Component
        key={index}
        idx={String(index)}
        visible={location.pathname.startsWith(to)}
        toggler={(
          <>
            {icon && icon}
            {name && name}
          </>
        )}
        {...rest}
      >
        {items?.map((item, index) => (
          item.items ? NavGroup(item, index) : NavItem(item, index)
        ))}
      </Component>
    );
    const NavItem = ({ component: Component, name, icon, ...rest }, index) => (
      <Component
        key={index}
        {...(rest.to &&
          !rest.items && {
          component: NavLink,
        })}
        {...rest}
      >
        {icon && icon}
        {name && name}
      </Component>
    );
    return (
      items && items.map((item, index) => (
        item.items ? NavGroup(item, index) : NavItem(item, index)
      ))
    )
  };

  return (
    <CSidebar
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch(sidebarSetShow(visible))
      }}
    >
      <CSidebarBrand className="d-none d-md-flex">
        <CIcon className="sidebar-brand-full" icon={logoBrand} height={35} />
        <CIcon className="sidebar-brand-narrow" icon={logo} height={35} />
      </CSidebarBrand>
      <CSidebarNav>
        <SidebarNav items={navigation} />
      </CSidebarNav>
      <CSidebarToggler
        className="d-none d-xl-flex"
        onClick={() => dispatch(sidebarSetFold(!unfoldable))}
      />
    </CSidebar>
  )
}

export default Sidebar;
