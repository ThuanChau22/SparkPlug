import { useDispatch } from "react-redux";
import {
  NavLink,
} from "react-router-dom";
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from "@coreui/react";
import {
  cilAccountLogout,
  cilContrast,
  cilMoon,
  cilSettings,
  cilSun,
  cilUser,
} from "@coreui/icons";
import CIcon from "@coreui/icons-react";

import defaultAvatar from "assets/default-avatar.jpg";
import useTheme from "hooks/useTheme";
import routes from "routes";
import { authLogout } from "redux/auth/authSlice";

const HeaderDropdown = () => {

  const { ThemeModes, theme, setTheme } = useTheme();

  const dispatch = useDispatch();

  const ThemeIcon = (selectedTheme) => (
    selectedTheme === ThemeModes.Light
      ? cilSun
      : selectedTheme === ThemeModes.Dark
        ? cilMoon
        : cilContrast
  );

  const handleLogout = () => {
    dispatch(authLogout());
  };

  return (
    <>
      <CDropdown className="border-end border-opacity-75" variant="nav-item">
        <CDropdownToggle className="d-flex flex-row" caret={false}>
          <CIcon
            className="justify-content-center"
            icon={ThemeIcon(theme)}
            size="lg"
          />
        </CDropdownToggle>
        <CDropdownMenu>
          {Object.entries(ThemeModes).map(([label, value]) => (
            <CDropdownItem
              key={label}
              active={theme === value}
              onClick={() => setTheme(value)}
            >
              <CIcon icon={ThemeIcon(value)} className="me-2" />
              {label}
            </CDropdownItem>
          ))}
        </CDropdownMenu>
      </CDropdown>
      <CDropdown variant="nav-item">
        <CDropdownToggle caret={false}>
          <CAvatar src={defaultAvatar} size="md" />
        </CDropdownToggle>
        <CDropdownMenu>
          <CDropdownItem to={routes.Profile.path} as={NavLink}>
            <CIcon icon={cilUser} className="me-2" />
            {routes.Profile.name}
          </CDropdownItem>
          <CDropdownItem to={routes.Settings.path} as={NavLink}>
            <CIcon icon={cilSettings} className="me-2" />
            {routes.Settings.name}
          </CDropdownItem>
          <CDropdownDivider />
          <CDropdownItem onClick={handleLogout}>
            <CIcon icon={cilAccountLogout} className="me-2" />
            Logout
          </CDropdownItem>
        </CDropdownMenu>
      </CDropdown>
    </>
  )
}

export default HeaderDropdown
