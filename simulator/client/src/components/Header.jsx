import { useCallback, useContext, useRef } from "react";
import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderBrand,
} from "@coreui/react";
import {
  cilContrast,
  cilMoon,
  cilSun,
} from "@coreui/icons";
import CIcon from "@coreui/icons-react";

import logoBrand from "assets/logo-brand";
import useTheme from "hooks/useTheme";
import useWindowResize from "hooks/useWindowResize";
import { LayoutContext } from "contexts";

const Header = () => {
  const headerRef = useRef({});

  const { setHeaderHeight } = useContext(LayoutContext);

  const { ThemeModes, theme, setTheme } = useTheme();

  const ThemeIcon = (selectedTheme) => (
    selectedTheme === ThemeModes.Light
      ? cilSun
      : selectedTheme === ThemeModes.Dark
        ? cilMoon
        : cilContrast
  );

  useWindowResize(useCallback(() => {
    setHeaderHeight(headerRef.current?.offsetHeight);
  }, [setHeaderHeight]));

  return (
    <CHeader ref={headerRef} position="sticky" className="p-0">
      <CContainer fluid>
        <CHeaderBrand className="mx-auto mx-md-0">
          <CIcon icon={logoBrand} height={30} alt="Logo" />
        </CHeaderBrand>
        <CHeaderNav className="d-flex align-items-center">
          <CDropdown variant="nav-item">
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
        </CHeaderNav>
      </CContainer >
    </CHeader >
  );
};

export default Header;
