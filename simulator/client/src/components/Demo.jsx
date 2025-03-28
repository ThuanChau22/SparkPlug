import { useContext, useEffect, useMemo, useState } from "react";
import { ReadyState } from "react-use-websocket";
import {
  CButton,
  CInputGroup,
  CInputGroupText,
  CProgress,
} from "@coreui/react";
import {
  EvStation,
  EvStationOutlined,
} from "@mui/icons-material";

import useSocket from "hooks/useSocket";
import { ToastContext } from "contexts";

const Demo = ({ search }) => {
  const { setToastMessage } = useContext(ToastContext);

  const WS_ENDPOINT = process.env.REACT_APP_WS_ENDPOINT;
  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } = useSocket(`${WS_ENDPOINT}/demo`);

  const DemoStatus = useMemo(() => ({
    IDLE: "Idle",
    STARTING: "Starting",
    STARTED: "Started",
    STOPPING: "Stopping",
  }), []);

  const DemoAction = useMemo(() => ({
    SYNCED: "Synced",
    START: "Start",
    PROGRESS: "Progress",
    STOP: "Stop",
  }), []);

  const [isSocketLost, setSocketLost] = useState(false);
  const [status, setStatus] = useState(DemoStatus.IDLE);
  const [evseCount, setEvseCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const { isIdle, isStarting, isStopping } = useMemo(() => ({
    isIdle: status === DemoStatus.IDLE,
    isStarting: status === DemoStatus.STARTING,
    isStarted: status === DemoStatus.STARTED,
    isStopping: status === DemoStatus.STOPPING,
  }), [DemoStatus, status]);

  const progress = useMemo(() => {
    return (evseCount / totalCount || 0) * 100;
  }, [evseCount, totalCount]);

  useEffect(() => {
    const isClosing = readyState === ReadyState.CLOSING;
    const isClosed = readyState === ReadyState.CLOSED;
    if (isClosing || isClosed) {
      setSocketLost(true);
      setToastMessage({
        color: "danger",
        text: "Connection Lost",
      });
    }
    const isOpen = readyState === ReadyState.OPEN;
    if (isSocketLost && isOpen) {
      setSocketLost(false);
      setToastMessage({
        color: "info",
        text: "Connection Restored",
      });
    }
  }, [readyState, isSocketLost, setToastMessage]);

  const startDemo = (search) => {
    if (readyState === ReadyState.OPEN) {
      const action = DemoAction.START;
      const payload = {};
      if (search) {
        payload.search = search;
        payload.sort_by = "-search_score";
      }
      sendJsonMessage({ action, payload });
    }
  };

  const stopDemo = () => {
    if (readyState === ReadyState.OPEN) {
      const action = DemoAction.STOP;
      sendJsonMessage({ action, payload: {} });
    }
  };

  useEffect(() => {
    const { action, payload } = lastJsonMessage || {};
    if (lastJsonMessage && payload.status === "Rejected") {
      setToastMessage({
        color: "danger",
        text: payload.message,
      });
      return;
    }
    if (action === DemoAction.SYNCED) {
      const { status, evseCount, totalCount } = payload;
      setStatus(status);
      setEvseCount(evseCount);
      setTotalCount(totalCount);
    }
    if (action === DemoAction.START) {
      setStatus(DemoStatus.STARTING);
    }
    if (action === DemoAction.STOP) {
      setStatus(DemoStatus.STOPPING);
    }
    if (action === DemoAction.PROGRESS) {
      const { status, evseCount, totalCount } = payload;
      setStatus(status);
      setEvseCount(evseCount);
      setTotalCount(totalCount);
    }
  }, [DemoStatus, DemoAction, lastJsonMessage, setToastMessage]);

  return (
    <>
      <h5>Simulation Demo</h5>
      <CProgress
        height={25}
        color={isStopping ? "danger" : "info"}
        value={progress}
        {...(isStarting || isStopping
          ? { variant: "striped", animated: true }
          : {}
        )}
      >
        {progress ? `${evseCount}/${totalCount}` : ""}
      </CProgress>
      <CInputGroup className="m-0 mt-2">
        <CInputGroupText className={`border border-${isStopping ? "danger" : "info"}`}>
          {isIdle
            ? <EvStationOutlined />
            : <EvStation color={isStopping ? "danger" : "info"} />
          }

        </CInputGroupText>
        <CButton
          className="flex-grow-1"
          color={isStopping ? "danger" : "info"}
          variant="outline"
          onClick={isIdle
            ? () => startDemo(search)
            : stopDemo
          }
        >
          {isIdle ? "Start" : "Stop"}
        </CButton>
      </CInputGroup>
    </>
  );
};

export default Demo;
