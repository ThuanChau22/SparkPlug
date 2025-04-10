import { useEffect, useRef, useState } from "react";
import ms from "ms";
import {
  CButton,
  CCard,
  CCardBody,
  CCardTitle,
  CCol,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from "@coreui/react";
import {
  Contactless,
  ContactlessOutlined,
  EvStation,
  Password,
  Power,
  PowerOutlined,
} from '@mui/icons-material';

const Evse = ({ evse }) => {
  const meterTimeoutRef = useRef(0);
  const [meterValue, setMeterValue] = useState(0);
  const [rfid, setRFID] = useState("");
  useEffect(() => {
    setMeterValue(evse.meterValue);
    clearTimeout(meterTimeoutRef.current);
    meterTimeoutRef.current = setTimeout(() => {
      setMeterValue(0);
    }, ms("5s"));
  }, [evse.meterValue]);
  useEffect(() => () => clearTimeout(meterTimeoutRef.current), []);
  return (
    <CCard className="px-3 pb-3 shadow-sm">
      <CCardBody>
        <CCardTitle className="text-medium-emphasis py-2">
          EVSE ID: {evse.id}
        </CCardTitle>
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
                <Password color={rfid ? "primary" : ""} />
              </CInputGroupText>
              <CFormInput
                type="password"
                name="RFID"
                placeholder="Enter RFID Code"
                className="text-center border border-primary shadow-none"
                disabled={!evse.isConnected}
                value={rfid}
                onChange={({ target }) => setRFID(target.value)}
              />
            </CInputGroup>
          </CCol>
          <CCol xs={12}>
            <CInputGroup>
              <CInputGroupText className="border border-primary">
                {evse.isAuthorized
                  ? <Contactless color="primary" />
                  : <ContactlessOutlined />
                }
              </CInputGroupText>
              <CButton
                color="primary"
                variant="outline"
                className="flex-grow-1"
                disabled={!evse.isConnected}
                onClick={() => {
                  evse.scanRFID(rfid);
                  setRFID("");
                }}
              >
                Scan RFID
              </CButton>
            </CInputGroup>
          </CCol>
          <CCol xs={12}>
            <CInputGroup>
              <CInputGroupText className="border border-primary">
                {evse.isCablePluggedIn
                  ? <Power color="primary" />
                  : <PowerOutlined />
                }
              </CInputGroupText>
              <CButton
                color="primary"
                variant="outline"
                className="flex-grow-1"
                disabled={!evse.isConnected}
                onClick={() => evse.isCablePluggedIn
                  ? evse.unplugCable()
                  : evse.pluginCable()
                }
              >
                {evse.isCablePluggedIn
                  ? "Unplug Cable"
                  : "Plugin Cable"
                }
              </CButton>
            </CInputGroup>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  );
};

export default Evse;
