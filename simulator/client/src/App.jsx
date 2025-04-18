import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CCard,
  CCol,
  CRow,
} from "@coreui/react";
import {
  useParams,
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";

import StationList from "components/StationList";

import Header from "components/Header";
import Footer from "components/Footer";
import ErrorToast from "components/ErrorToast";
import useTheme from "hooks/useTheme";
import useWindowResize from "hooks/useWindowResize";
import {
  ToastContext,
  LayoutContext,
} from "contexts";

const App = () => {
  useTheme();

  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const [toastMessage, setToastMessage] = useState({ color: "", text: "" });

  const showList = useMemo(() => (
    !isMobile || (isMobile && !params.stationId)
  ), [isMobile, params]);

  const showStation = useMemo(() => (
    !isMobile || (isMobile && params.stationId)
  ), [isMobile, params]);

  useWindowResize(useCallback(() => {
    const medium = "only screen and (min-width: 768px)";
    setIsMobile(!window.matchMedia(medium).matches)
  }, []));

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/stations", { replace: true });
    }
  }, [location, navigate]);

  const toastContext = {
    toastMessage,
    setToastMessage,
  };

  const layoutContext = {
    isMobile,
    headerHeight,
    footerHeight,
    setIsMobile,
    setHeaderHeight,
    setFooterHeight,
  };

  return (
    <div className="min-vh-100 d-flex flex-column wrapper">
      <ToastContext.Provider value={toastContext}>
        <LayoutContext.Provider value={layoutContext}>
          <ErrorToast />
          <Header />
          <div className="body d-flex flex-column flex-grow-1">
            <CCard className="flex-grow-1 border border-0 rounded-0">
              <CRow className="flex-grow-1" xs={{ gutterX: 0 }}>
                <CCol md={6} lg={5} className={`${showList ? "" : "d-none"}`}>
                  <StationList />
                </CCol>
                {showStation && (
                  <CCol md={6} lg={7} >
                    <Outlet />
                  </CCol>
                )}
              </CRow>
            </CCard>
          </div>
          <Footer />
        </LayoutContext.Provider>
      </ToastContext.Provider>
    </div>
  );
};

export default App;
