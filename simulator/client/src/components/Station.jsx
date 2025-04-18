import {
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  data,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "react-router-dom";
import {
  CButton,
  CCloseButton,
  CCol,
  CInputGroup,
  CInputGroupText,
  CRow,
} from "@coreui/react";
import {
  Cloud,
  CloudOutlined,
} from "@mui/icons-material";

import { getEvseListByStation } from "api/stations";
import Evse from "components/Evse";
import LoadingIndicator from "components/LoadingIndicator";
import StickyContainer from "components/StickyContainer";
import useStationSocket from "hooks/useStationSocket";
import useWindowResize from "hooks/useWindowResize";
import { LayoutContext } from "contexts";

export const loader = async ({ params }) => {
  const { stationId } = params;
  const evses = await getEvseListByStation(stationId);
  if (evses.length === 0) {
    throw data("Not Found", { status: 404 });
  }
  return { stationId, evses };
}

const Station = () => {
  const navigate = useNavigate();
  const { state } = useNavigation();
  const { stationId, evses } = useLoaderData();

  const { headerHeight, footerHeight } = useContext(LayoutContext);

  const [titleHeight, setTitleHeight] = useState(0);
  const titleRef = useCallback((node) => {
    setTitleHeight(node?.getBoundingClientRect().height);
  }, []);

  const [gridHeight, setGridHeight] = useState(0);
  useWindowResize(useCallback(() => {
    setGridHeight(window.innerHeight - headerHeight - titleHeight - footerHeight);
  }, [headerHeight, titleHeight, footerHeight]));

  const [evseList, setEvseList] = useState([]);

  const {
    isCSMSConnected,
    connectCSMS,
    disconnectCSMS,
    scanRFID,
    pluginCable,
    unplugCable,
  } = useStationSocket(stationId, {
    onMeterValue: useCallback(({ evseId, meterValue }) => {
      setEvseList((evseList) => {
        const changes = [...evseList];
        const [{ sampledValue: [{ value }] }] = meterValue;
        changes[evseId - 1].meterValue = value;
        return changes;
      });
    }, []),
    onAuthorize: useCallback(({ evseId, isAuthorized }) => {
      setEvseList((evseList) => {
        const changes = [...evseList];
        changes[evseId - 1].isAuthorized = isAuthorized;
        return changes;
      });
    }, []),
    onPluginCable: useCallback(({ evseId }) => {
      setEvseList((evseList) => {
        const changes = [...evseList];
        changes[evseId - 1].isCablePluggedIn = true;
        return changes;
      });
    }, []),
    onUnplugCable: useCallback(({ evseId }) => {
      setEvseList((evseList) => {
        const changes = [...evseList];
        changes[evseId - 1].isCablePluggedIn = false;
        return changes;
      });
    }, []),
  });

  useEffect(() => {
    setEvseList(evses.map(({ evse_id }) => ({
      id: evse_id,
      meterValue: 0,
      isConnected: false,
      isAuthorized: false,
      isRFIDScanned: false,
      isCablePluggedIn: false,
      scanRFID: (rfid) => scanRFID(evse_id, rfid),
      pluginCable: () => pluginCable(evse_id),
      unplugCable: () => unplugCable(evse_id),
    })));
  }, [evses, scanRFID, pluginCable, unplugCable]);

  useEffect(() => {
    setEvseList((evseList) => {
      const changes = [...evseList];
      changes.forEach((evse) => evse.isConnected = isCSMSConnected);
      return changes;
    });
  }, [isCSMSConnected]);

  return (state === "loading"
    ? <LoadingIndicator />
    : (
      <>
        <StickyContainer ref={titleRef} style={{ top: `${headerHeight}px` }}>
          <h5
            className="d-block d-md-flex justify-content-between align-items-center px-4 py-2 m-0 shadow-sm"
            style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
          >
            <div className="d-flex d-md-inline justify-content-between">
              <span>Station ID: {stationId}</span>
              <CCloseButton
                className="d-block d-md-none"
                onClick={() => navigate("/stations")}
              />
            </div>
            <CInputGroup className="w-auto mt-3 m-md-0">
              <CInputGroupText className="border border-primary">
                {isCSMSConnected
                  ? <Cloud color="primary" />
                  : <CloudOutlined />
                }
              </CInputGroupText>
              <CButton
                className="flex-grow-1 flex-md-grow-0"
                color="primary"
                variant="outline"
                onClick={isCSMSConnected ? disconnectCSMS : connectCSMS}
              >
                {isCSMSConnected ? "Disconnect" : "Connect"}
              </CButton>
            </CInputGroup>
          </h5>
        </StickyContainer>
        <div
          className="overflow-auto pt-1 px-2 pb-3"
          style={{ height: `${gridHeight}px` }}
        >
          <CRow
            className={`m-0${evseList.length === 1 ? " justify-content-center" : ""}`}
            xs={{ cols: 1, gutter: 3 }}
            lg={{ cols: 2 }}
            xxl={{ cols: evseList.length <= 2 ? 2 : 3 }}
          >
            {evseList.map((evse) => (
              <CCol key={evse.id}>
                <Evse evse={evse} />
              </CCol>
            ))}
          </CRow>
        </div>
      </>
    )
  );
};

export default Station;
