import { useDispatch } from "react-redux";
import {
  NavLink,
} from "react-router-dom";
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from "@coreui/react";
import {
  cilAccountLogout,
  cilSettings,
  cilUser,
} from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import defaultAvatar from "assets/default-avatar.jpg";
import routes from "routes";

import { authLogout } from "redux/auth/authSlice";

const HeaderDropdown = () => {
  const dispatch = useDispatch();
  const handleLogout = () => {
    dispatch(authLogout());
  };
  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0" caret={false}>
        <CAvatar src={defaultAvatar} size="md" />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-light fw-semibold py-2">Account</CDropdownHeader>
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
  )
}

export default HeaderDropdown
