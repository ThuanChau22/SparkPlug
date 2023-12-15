import { useEffect, useState } from "react";
import {
  useSelector,
  useDispatch,
} from "react-redux";
import {
  NavLink,
} from "react-router-dom";
import {
  CNavItem,
  CNavTitle,
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
import logo from "assets/logo";
import logoBrand from "assets/logo-brand";
import routes from "routes";

const Sidebar = () => {
  const dispatch = useDispatch();
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const authIsOwner = useSelector(selectAuthRoleIsOwner);
  const authIsDriver = useSelector(selectAuthRoleIsDriver);
  const headerActive = useSelector(selectHeaderActive);
  const unfoldable = useSelector(selectSidebarFold);
  const sidebarShow = useSelector(selectSidebarShow);
  const [navigation, setNavigation] = useState([]);
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
        component: CNavItem,
        name: Sites.name,
        to: Sites.Components[headerActive]?.path || Sites.defaultPath,
        icon: <AccountTreeOutlined className="nav-icon" />,
      });
      newNavigation.push({
        component: CNavItem,
        name: Stations.name,
        to: Stations.Components[headerActive]?.path || Stations.defaultPath,
        icon: <EvStationOutlined className="nav-icon" />,
      });
      if (authIsAdmin) {
        newNavigation.push({
          component: CNavItem,
          name: Users.name,
          to: Users.Components[headerActive]?.path || Users.defaultPath,
          icon: <GroupsOutlined className="nav-icon" />,
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
  }, [authIsAdmin, authIsOwner, authIsDriver, headerActive]);
  const SidebarNav = ({ items }) => (
    items && items.map((item, index) => {
      const { component, name, icon, ...rest } = item
      const Component = component
      return (
        <Component
          {...(rest.to &&
            !rest.items && {
            component: NavLink,
          })}
          key={index}
          {...rest}
        >
          {icon && icon}
          {name && name}
        </Component>
      )
    })
  );
  return (
    <CSidebar
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch(sidebarSetShow(visible))
      }}
    >
      <CSidebarBrand className="d-none d-md-flex" to="/">
        <CIcon className="sidebar-brand-full" icon={logoBrand} height={35} />
        <CIcon className="sidebar-brand-narrow" icon={logo} height={35} />
      </CSidebarBrand>
      <CSidebarNav>
        <SidebarNav items={navigation} />
      </CSidebarNav>
      <CSidebarToggler
        className="d-none d-lg-flex"
        onClick={() => dispatch(sidebarSetFold(!unfoldable))}
      />
    </CSidebar>
  )
}

export default Sidebar;