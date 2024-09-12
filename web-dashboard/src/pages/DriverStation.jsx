import { useCallback, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
  CRow,
  CCol,
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";
import ms from "ms";

import LoadingIndicator from "components/LoadingIndicator";
import StickyContainer from "components/StickyContainer";
import DriverStationListItem from "components/DriverStation/StationListItem";
import DriverStationMapView from "components/DriverStation/MapView";
import DriverStationDetailsModal from "components/DriverStation/DetailsModal";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import {
  stationGetList,
  selectStationList,
} from "redux/station/stationSlice";
import {
  evseStatusStateUpsertMany,
  evseStatusStateUpsertById,
  evseStatusGetList,
  selectEvseStatusIds,
} from "redux/evse/evseStatusSlice";

const DriverStation = () => {
  const StationEventWS = process.env.REACT_APP_STATION_EVENT_WS_ENDPOINT;

  const headerHeight = useSelector(selectLayoutHeaderHeight);
  const token = useSelector(selectAuthAccessToken);
  const stationList = useSelector(selectStationList);
  const evseStatusIds = useSelector(selectEvseStatusIds);

  const [loading, setLoading] = useState(false);

  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [stationId, setStationId] = useState(null);

  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } = useWebSocket(`${StationEventWS}`, {
    queryParams: { token },
    heartbeat: {
      message: "ping",
      returnMessage: "pong",
      timeout: ms("60s"),
      interval: ms("30s"),
    },
    shouldReconnect: ({ code }) => code === 1006,
  });

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (stationList.length === 0) {
      setLoading(true);
      await dispatch(stationGetList()).unwrap();
      setLoading(false);
    }
  }, [stationList.length, dispatch]);

  const fetchEvseStatusData = useCallback(async () => {
    if (evseStatusIds.length === 0) {
      setLoading(true);
      await dispatch(evseStatusGetList()).unwrap();
      setLoading(false);
    }
  }, [evseStatusIds.length, dispatch]);

  useEffect(() => {
    fetchData();
    fetchEvseStatusData();
  }, [fetchData, fetchEvseStatusData]);

  useEffect(() => {
    const isStationLoaded = stationList.length > 0;
    const isConnected = readyState === ReadyState.OPEN;
    if (isStationLoaded && isConnected) {
      const stationIds = stationList.map(({ id }) => id);
      sendJsonMessage({
        action: "WatchStatusEvent",
        payload: { stationIds },
      });
    }
  }, [stationList, readyState, sendJsonMessage]);

  useEffect(() => {
    const { action, payload } = lastJsonMessage || {};
    if (action === "WatchStatusEvent" && payload.stationId) {
      const { stationId, payload: { evseId, connectorStatus } } = payload;
      if (evseId) {
        dispatch(evseStatusStateUpsertById({
          station_id: stationId,
          evse_id: evseId,
          status: connectorStatus,
        }));
      } else {
        dispatch(evseStatusStateUpsertMany(evseStatusIds
          .filter(({ station_id }) => station_id === stationId)
          .map(({ station_id, evse_id }) => ({
            station_id, evse_id,
            status: connectorStatus,
          }))));
      }
    }
  }, [lastJsonMessage, evseStatusIds, dispatch]);

  const handleViewStation = (stationId) => {
    setStationId(stationId);
    setIsAnalyticsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CRow xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="d-flex flex-column h-100 p-0 pb-3">
            <StickyContainer style={{ top: `${headerHeight}px` }}>
              <CCardTitle
                className="p-3 shadow-sm"
                style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
              >
                Stations
              </CCardTitle>
            </StickyContainer>
            {loading
              ? <LoadingIndicator loading={loading} />
              : (
                <CListGroup className="px-3">
                  {stationList.map(({ id }) => (
                    <CListGroupItem
                      key={id}
                      className="d-flex flex-row justify-content-between align-items-center py-3"
                      as="button"
                      onClick={() => handleViewStation(id)}
                    >
                      <DriverStationListItem stationId={id} />
                    </CListGroupItem>
                  ))}
                </CListGroup>
              )}
          </CCardBody>
        </CCol>
        <CCol md={6} lg={7}>
          <DriverStationMapView handleViewStation={handleViewStation} />
        </CCol>
      </CRow>
      {isAnalyticsModalOpen && (
        <DriverStationDetailsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
          stationId={stationId}
        />
      )}
    </CCard>
  );
};

export default DriverStation;
