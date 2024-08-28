import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavLink, useLocation } from "react-router-dom";
import {
  CNavItem,
  CNavGroup,
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CSidebarToggler,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  AccountTreeOutlined,
  BarChartOutlined,
  EvStationOutlined,
  PeopleOutlined,
  StarOutlined,
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
  selectLayoutHeaderActive,
  selectLayoutSidebarShow,
  selectLayoutSidebarFold,
  layoutSetMobile,
  layoutSetSidebarShow,
  layoutSetSidebarFold,
} from "redux/layout/layoutSlice";

const Sidebar = () => {
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const authIsOwner = useSelector(selectAuthRoleIsOwner);
  const authIsDriver = useSelector(selectAuthRoleIsDriver);
  const headerActive = useSelector(selectLayoutHeaderActive);
  const sidebarFold = useSelector(selectLayoutSidebarFold);
  const sidebarShow = useSelector(selectLayoutSidebarShow);
  const [navigation, setNavigation] = useState([]);
  const location = useLocation();
  const dispatch = useDispatch();

  const handleResize = useCallback(() => {
    const medium = "only screen and (min-width: 768px)";
    dispatch(layoutSetMobile(!window.matchMedia(medium).matches));
    const extraLarge = "only screen and (min-width: 1200px)";
    if (!window.matchMedia(extraLarge).matches) {
      dispatch(layoutSetSidebarFold(true));
    }
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
    const newNavigation = [];
    if (authIsAdmin || authIsOwner) {
      newNavigation.push({
        as: CNavItem,
        name: routes.Dashboard.name,
        to: routes.Dashboard.path,
        icon: <BarChartOutlined className="nav-icon" />,
      });
      newNavigation.push({
        as: CNavGroup,
        name: routes.Stations.name,
        to: routes.Stations.Components[headerActive]?.path || routes.Stations.defaultPath,
        className: "centered-nav-item",
        icon: <EvStationOutlined className="nav-icon" />,
        items: [
          {
            as: CNavItem,
            name: routes.Stations.Components.Management.name,
            to: routes.Stations.Components.Management.path,
            className: "centered-nav-item",
          },
          {
            as: CNavItem,
            name: routes.Stations.Components.Monitor.name,
            to: routes.Stations.Components.Monitor.path,
            className: "centered-nav-item",
          },
          {
            as: CNavItem,
            name: routes.Stations.Components.Analytics.name,
            to: routes.Stations.Components.Analytics.path,
            className: "centered-nav-item",
          },
        ],
      });
      newNavigation.push({
        as: CNavItem,
        name: routes.Sites.name,
        to: routes.Sites.path,
        icon: <AccountTreeOutlined className="nav-icon" />,
      });
      if (authIsAdmin) {
        newNavigation.push({
          as: CNavItem,
          name: routes.Users.name,
          to: routes.Users.path,
          icon: <PeopleOutlined className="nav-icon" />,
        });
      }
      newNavigation.push({
        as: CNavItem,
        name: routes.StationPrediction.name,
        to: routes.StationPrediction.path,
        icon: <StarOutlined className="nav-icon" />,
      });
    }
    if (authIsDriver) {
      newNavigation.push({
        as: CNavItem,
        name: routes.Driver.Components.Dashboard.name,
        to: routes.Driver.Components.Dashboard.path,
        icon: <BarChartOutlined className="nav-icon" />,
      });
      newNavigation.push({
        as: CNavItem,
        name: routes.Driver.Components.Stations.name,
        to: routes.Driver.Components.Stations.path,
        icon: <EvStationOutlined className="nav-icon" />,
      });
    }
    setNavigation(newNavigation);
  }, [authIsAdmin, authIsOwner, authIsDriver, headerActive]);

  const SidebarNav = ({ items }) => {
    const location = useLocation();
  
    const NavGroup = ({ as: Component, name, icon, to, items, ...rest }, index) => (
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
  
    const NavItem = ({ as: Component, name, icon, to, ...rest }, index) => {
    
      return (
        <NavLink key={index} to={to} {...rest} className="nav-item">
          <div className="nav-content">
            {icon && <span className="nav-icon">{icon}</span>}
            {name && <span className="nav-name">{name}</span>}
          </div>
        </NavLink>
      );
    };
    
  
    return items?.map((item, index) =>
      item.items ? NavGroup(item, index) : NavItem(item, index)
    );
  };

  return (
    <CSidebar
      position="fixed"
      unfoldable={sidebarFold}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch(layoutSetSidebarShow(visible))
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
        onClick={() => dispatch(layoutSetSidebarFold(!sidebarFold))}
      />
    </CSidebar>
  )
}

export default Sidebar;
