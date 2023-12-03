import { useEffect, useMemo, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import ms from "ms";
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from "@coreui/react";
import {
  Contactless,
  ContactlessOutlined,
  EvStation,
  Pin,
  PinOutlined,
  Power,
  PowerOutlined,
  RestartAlt,
} from '@mui/icons-material';

import EVChargingStationImage from "assets/ev-charging-station.png";

const App = () => {
  const { REACT_APP_WS_ENDPOINT: WS_ENDPOINT } = process.env;
  const { REACT_APP_STATION_IDENTITY: STATION_ID } = process.env;
  const socket = useWebSocket(`${WS_ENDPOINT}/${STATION_ID}`, {
    heartbeat: {
      message: "ping",
      returnMessage: "pong",
      timeout: ms("60s"),
      interval: ms("30s"),
    },
    shouldReconnect: ({ code }) => {
      return code === 1006;
    },
  });
  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } = socket;

  const WebSocketAction = useMemo(() => ({
    SCAN_RFID: "ScanRFID",
    PLUGIN_CABLE: "PluginCable",
    UNPLUG_CABLE: "UnplugCable",
    RESET: "Reset",
  }), []);

  const [wattage, setWattage] = useState(0);
  const [rfid, setRFID] = useState("");
  const [isRFIDScanned, setIsRFIDScanned] = useState(false);
  const [isCablePluggedIn, setIsCablePluggedIn] = useState(false);
  const [message, setMessage] = useState({ text: "", style: "" });

  // Delete later
  useEffect(() => {
    setWattage(3247);
  }, []);

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      setMessage({ text: "", style: "" });
    }
    if (readyState === ReadyState.CONNECTING) {
      setMessage({
        text: "Connecting",
        style: "text-info",
      });
    }
    const isClosing = readyState === ReadyState.CLOSING;
    const isClosed = readyState === ReadyState.CLOSED;
    if (isClosed || isClosing) {
      setMessage({
        text: "Connection Lost",
        style: "text-danger",
      });
    }
  }, [readyState]);

  useEffect(() => {
    const { action } = lastJsonMessage || {};
    if (action === WebSocketAction.SCAN_RFID) {
      setIsRFIDScanned(true);
    }
    if (action === WebSocketAction.PLUGIN_CABLE) {
      setIsCablePluggedIn(true);
    }
    if (action === WebSocketAction.UNPLUG_CABLE) {
      setIsCablePluggedIn(false);
    }
    if (action === WebSocketAction.RESET) {
      console.log("Reset");
    }
  }, [lastJsonMessage, WebSocketAction]);

  const handleScanRFID = () => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: WebSocketAction.SCAN_RFID,
        payload: { id: rfid },
      });
    }
  };

  const handlePluginCable = () => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: WebSocketAction.PLUGIN_CABLE,
        payload: {},
      });
    }
  };

  const handleUnplugCable = () => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: WebSocketAction.UNPLUG_CABLE,
        payload: {},
      });
    }
  };

  const handleReset = () => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: WebSocketAction.RESET,
        payload: {},
      });
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol lg={7} md={11} xs={12}>
            <CCardGroup>
              <CCard className="px-4 pb-3">
                <CCardBody>
                  <h1>EV Station Simulator</h1>
                  <h5 className="text-medium-emphasis py-2">
                    Station ID: {STATION_ID}
                  </h5>
                  <CRow>
                    <CCol xl={5} lg={6} xs={5} className="d-flex align-items-center">
                      <div className="d-none d-sm-block">
                        <img
                          className="img-fluid"
                          src={EVChargingStationImage}
                          alt="ev-charging-station"
                        />
                      </div>
                    </CCol>
                    <CCol xl={7} lg={6} sm={7} xs={12}>
                      <CRow xs={{ gutterY: 3 }} className="d-flex flex-row align-items-center">
                        <CCol xs={12}>
                          <p className={`text-center m-0 ${message.style}`}>
                            {message.text}
                          </p>
                        </CCol>
                        <CCol xs={12}>
                          <CInputGroup>
                            <CInputGroupText className="border border-warning">
                              <EvStation color="warning" />
                            </CInputGroupText>
                            <div className="border border-warning rounded-end text-center text-warning fw-bold flex-grow-1">
                              <h5 className="p-1 m-0">{wattage} Wh</h5>
                            </div>
                          </CInputGroup>
                        </CCol>
                        <CCol xs={12}>
                          <CInputGroup>
                            <CInputGroupText className="border border-primary">
                              {rfid ?
                                <Pin color="primary" />
                                : <PinOutlined />
                              }
                            </CInputGroupText>
                            <CFormInput
                              type="password"
                              name="RFID"
                              placeholder="Enter RFID Code"
                              className="text-center border border-primary shadow-none"
                              onChange={(e) => setRFID(e.target.value)}
                            />
                          </CInputGroup>
                        </CCol>
                        <CCol xs={12}>
                          <CInputGroup>
                            <CInputGroupText className="border border-primary">
                              {isRFIDScanned
                                ? <Contactless color="primary" />
                                : <ContactlessOutlined />
                              }
                            </CInputGroupText>
                            <CButton
                              color="primary"
                              variant="outline"
                              className="flex-grow-1"
                              onClick={handleScanRFID}
                            >
                              Scan RFID
                            </CButton>
                          </CInputGroup>
                        </CCol>
                        <CCol xs={12}>
                          <CInputGroup>
                            <CInputGroupText className="border border-primary">
                              {isCablePluggedIn
                                ? <Power color="primary" />
                                : <PowerOutlined />
                              }
                            </CInputGroupText>
                            <CButton
                              color="primary"
                              variant="outline"
                              className="flex-grow-1"
                              onClick={isCablePluggedIn
                                ? handleUnplugCable
                                : handlePluginCable
                              }
                            >
                              {isCablePluggedIn
                                ? "Unplug Cable"
                                : "Plugin Cable"
                              }
                            </CButton>
                          </CInputGroup>
                        </CCol>
                        <CCol xs={12}>
                          <CInputGroup>
                            <CInputGroupText className="border border-primary">
                              <RestartAlt />
                            </CInputGroupText>
                            <CButton
                              color="primary"
                              variant="outline"
                              className="flex-grow-1"
                              onClick={handleReset}
                            >
                              Reset
                            </CButton>
                          </CInputGroup>
                        </CCol>
                      </CRow>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
}

export default App;
