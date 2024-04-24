import { useEffect, useMemo, useRef, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import ms from "ms";
import {
  CAlert,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CButton,
  CCard,
  CCardBody,
  CCardTitle,
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
  Cloud,
  CloudOutlined,
  EvStation,
  Pin,
  PinOutlined,
  Power,
  PowerOutlined,
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
    METER_VALUE: "MeterValue",
    SCAN_RFID: "ScanRFID",
    AUTHORIZE: "Authorize",
    PLUGIN_CABLE: "PluginCable",
    UNPLUG_CABLE: "UnplugCable",
    REMOTE_START: "RemoteStart",
    REMOTE_STOP: "RemoteStop",
    CONNECT_CSMS: "ConnectCSMS",
    DISCONNECT_CSMS: "DisconnectCSMS",
  }), []);

  const meterTimeoutRef = useRef(0);
  const [meterValue, setMeterValue] = useState(0);
  const [rfid, setRFID] = useState("");
  const [isRFIDScanned, setIsRFIDScanned] = useState(false);
  const [isCablePluggedIn, setIsCablePluggedIn] = useState(false);
  const [isCSMSConnected, setIsCSMSConnected] = useState(false);
  const defaultAlertMessage = useMemo(() => ({ color: "", text: "" }), []);
  const [alertMessage, setAlertMessage] = useState(defaultAlertMessage);

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      setAlertMessage(defaultAlertMessage);
    }
    if (readyState === ReadyState.CONNECTING) {
      setAlertMessage({
        color: "info",
        text: "Connecting",
      });
    }
    const isClosing = readyState === ReadyState.CLOSING;
    const isClosed = readyState === ReadyState.CLOSED;
    if (isClosed || isClosing) {
      setAlertMessage({
        color: "danger",
        text: "Connection Lost",
      });
    }
  }, [readyState, defaultAlertMessage]);

  useEffect(() => {
    const { action, payload } = lastJsonMessage || {};
    if (action === WebSocketAction.METER_VALUE) {
      const { meterValue: [{ sampledValue: [{ value }] }] } = payload;
      setMeterValue(value);
      clearTimeout(meterTimeoutRef.current);
      meterTimeoutRef.current = setTimeout(() => {
        setMeterValue(0);
      }, ms("5s"));
    }
    if (action === WebSocketAction.SCAN_RFID) {
      if (payload.status === "Accepted") {
        setRFID("");
      } else {
        setAlertMessage({
          color: "danger",
          text: "Invalid RFID",
        });
      }
    }
    if (action === WebSocketAction.AUTHORIZE) {
      if (payload.status === "Accepted") {
        setIsRFIDScanned(payload.isAuthorized);
      }
    }
    if (action === WebSocketAction.PLUGIN_CABLE) {
      setIsCablePluggedIn(true);
    }
    if (action === WebSocketAction.UNPLUG_CABLE) {
      setIsCablePluggedIn(false);
    }
    if (action === WebSocketAction.REMOTE_START) {
      console.log(action, payload);
    }
    if (action === WebSocketAction.REMOTE_STOP) {
      console.log(action, payload);
    }
    if (action === WebSocketAction.CONNECT_CSMS) {
      setIsCSMSConnected(true);
    };
    if (action === WebSocketAction.DISCONNECT_CSMS) {
      setIsCSMSConnected(false);
    };
  }, [lastJsonMessage, WebSocketAction]);

  const handleScanRFID = () => {
    setAlertMessage({ text: "", color: "" });
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: WebSocketAction.SCAN_RFID,
        payload: {
          evseId: 1,
          idToken: rfid,
        },
      });
    }
  };

  const handlePluginCable = () => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: WebSocketAction.PLUGIN_CABLE,
        payload: {
          evseId: 1,
          connectorId: 1,
        },
      });
    }
  };

  const handleUnplugCable = () => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: WebSocketAction.UNPLUG_CABLE,
        payload: {
          evseId: 1,
          connectorId: 1,
        },
      });
    }
  };

  const handleConnectCSMS = () => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: WebSocketAction.CONNECT_CSMS,
        payload: {},
      });
    }
  };

  const handleDisconnectCSMS = () => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: WebSocketAction.DISCONNECT_CSMS,
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
              <CCard className="px-3 pb-3">
                <CAlert
                  className="position-absolute start-0 w-100 shadow-sm"
                  color={alertMessage.color}
                  visible={alertMessage.text !== ""}
                  onClose={() => setAlertMessage(defaultAlertMessage)}
                  dismissible
                >
                  {alertMessage.text}
                </CAlert>
                <CCardBody>
                  <h1>EV Station Simulator</h1>
                  <CCardTitle className="text-medium-emphasis py-2">
                    Station ID: {STATION_ID}
                  </CCardTitle>
                  <CRow>
                    <CCol xl={4} lg={6} xs={5} className="d-flex align-items-center">
                      <div className="d-none d-sm-block">
                        <img
                          className="img-fluid"
                          src={EVChargingStationImage}
                          alt="ev-charging-station"
                        />
                      </div>
                    </CCol>
                    <CCol xl={8} lg={6} sm={7} xs={12} className="d-flex flex-row align-items-center">
                      <CRow xs={{ gutterY: 3 }} className="d-flex flex-row align-items-center">
                        <CCol xs={12}>
                          <CInputGroup>
                            <CInputGroupText className="border border-warning">
                              <EvStation color="warning" />
                            </CInputGroupText>
                            <div className="border border-warning rounded-end text-center text-warning fw-bold flex-grow-1">
                              <h5 className="p-1 m-0">{meterValue} Wh</h5>
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
                              value={rfid}
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
                      </CRow>
                    </CCol>
                  </CRow>
                  <CAccordion className="pt-2">
                    <CAccordionItem >
                      <CAccordionHeader>
                        <span className="fw-medium">Admin</span>
                      </CAccordionHeader>
                      <CAccordionBody>
                        <CRow>
                          <CCol xs={12} className="p-0">
                            <CInputGroup>
                              <CInputGroupText className="border border-primary">
                                {isCSMSConnected
                                  ? <Cloud color="primary" />
                                  : <CloudOutlined />
                                }
                              </CInputGroupText>
                              <CButton
                                color="primary"
                                variant="outline"
                                className="flex-grow-1"
                                onClick={isCSMSConnected
                                  ? handleDisconnectCSMS
                                  : handleConnectCSMS
                                }
                              >
                                {isCSMSConnected
                                  ? "Disconnect"
                                  : "Connect"
                                } CSMS
                              </CButton>
                            </CInputGroup>
                          </CCol>
                        </CRow>
                      </CAccordionBody>
                    </CAccordionItem>
                  </CAccordion>
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
