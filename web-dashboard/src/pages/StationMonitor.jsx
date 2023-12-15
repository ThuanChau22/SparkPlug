import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";
import ms from "ms";

import StationMonitorModal from "components/StationMonitorModal";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import {
  stationStateUpdateById,
  stationGetAll,
  selectStationList,
} from "redux/station/stationSlide";

const StationMonitor = () => {
  const { REACT_APP_MONITORING_WS_ENDPOINT: WS_ENDPOINT } = process.env;
  const accessToken = useSelector(selectAuthAccessToken);
  const stationList = useSelector(selectStationList);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const socket = useWebSocket(`${WS_ENDPOINT}`, {
    queryParams: { token: accessToken },
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
  const dispatch = useDispatch();

  useEffect(() => {
    if (stationList.length === 0) {
      dispatch(stationGetAll());
    }
  }, [stationList, dispatch]);

  useEffect(() => {
    const isStationLoaded = stationList.length > 0;
    const isConnected = readyState === ReadyState.OPEN;
    if (isStationLoaded && isConnected) {
      const stationIdList = stationList.map(({ id }) => id.toString());
      sendJsonMessage({
        action: "WatchStatusEvent",
        payload: { stationIdList },
      });
    }
  }, [stationList, readyState, sendJsonMessage]);

  useEffect(() => {
    const { action, payload } = lastJsonMessage || {};
    if (action === "WatchStatusEvent" && payload.stationId) {
      const { stationId, payload: { connectorStatus } } = payload;
      dispatch(stationStateUpdateById({
        id: parseInt(stationId),
        status: connectorStatus,
      }));
    }
  }, [lastJsonMessage, dispatch]);

  const handleOnClick = (stationId) => {
    setSelectedStationId(stationId);
    setIsModalOpen(true);
  };

  return (
    <CCard>
      <CCardBody>
        <CCardTitle className="mb-3">
          Stations Monitor
        </CCardTitle>
        <CListGroup>
          {stationList.map(({ id, name, status }) => (
            <CListGroupItem
              key={id}
              className="d-flex justify-content-between align-items-center py-3"
              onClick={() => handleOnClick(id)}
            >
              <span>ID: {id}</span>
              <span>{name}</span>
              <span
                className={
                  status === "Available"
                    ? "text-success"
                    : status === "Occupied"
                      ? "text-warning"
                      : status === "Offline"
                        ? "text-secondary"
                        : "text-danger"
                }>
                {status}
              </span>
            </CListGroupItem>
          ))}
        </CListGroup>
      </CCardBody>
      {isModalOpen &&
        <StationMonitorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          stationId={selectedStationId}
        />
      }
    </CCard>
  );
};

export default StationMonitor;
