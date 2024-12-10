import { useCallback, useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CRow,
  CCol,
  CCard,
  CCardTitle,
  CCardBody,
} from "@coreui/react";

import StickyContainer from "components/StickyContainer";
import StationMonitorDetailsModal from "components/StationMonitor/DetailsModal";
import StationMonitorListView from "components/StationMonitor/ListView";
import StationMonitorMapView from "components/StationMonitor/MapView";
import useStationEventSocket, { Action } from "hooks/useStationEventSocket";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import {
  selectMapLowerBound,
  selectMapUpperBound,
} from "redux/map/mapSlice";
import {
  stationStateDeleteMany,
  stationStateClear,
  selectStationIds,
  selectStationList,
} from "redux/station/stationSlice";
import { evseStateClear } from "redux/evse/evseSlice";
import {
  evseStatusStateDeleteMany,
  evseStatusStateClear,
  selectEvseStatusList,
} from "redux/evse/evseStatusSlice";
import utils from "utils";

const StationMonitor = () => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);

  const stationIds = useSelector(selectStationIds);
  const stationList = useSelector(selectStationList);
  const evseStatusList = useSelector(selectEvseStatusList);

  const [titleHeight, setTitleHeight] = useState(0);
  const titleRef = useCallback((node) => {
    setTitleHeight(node?.getBoundingClientRect().height);
  }, []);

  const listRefHeight = useMemo(() => {
    return headerHeight + titleHeight;
  }, [headerHeight, titleHeight]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stationId, setStationId] = useState(null);

  useStationEventSocket({
    action: Action.WatchStatusEvent,
    payload: { stationIds },
  });

  const dispatch = useDispatch();

  useEffect(() => {
    const stationIds = utils.outOfBoundResources(stationList, {
      lowerBound: mapLowerBound,
      upperBound: mapUpperBound,
    }).map(({ id }) => id);
    dispatch(stationStateDeleteMany(stationIds));
  }, [stationList, mapLowerBound, mapUpperBound, dispatch]);

  useEffect(() => {
    const evseStatusIds = utils.outOfBoundResources(evseStatusList, {
      lowerBound: mapLowerBound,
      upperBound: mapUpperBound,
    }).map(({ station_id, evse_id }) => ({ station_id, evse_id }));
    dispatch(evseStatusStateDeleteMany(evseStatusIds));
  }, [evseStatusList, mapLowerBound, mapUpperBound, dispatch]);

  useEffect(() => () => {
    dispatch(stationStateClear());
    dispatch(evseStateClear());
    dispatch(evseStatusStateClear());
  }, [dispatch]);

  const handleViewStation = (stationId) => {
    setStationId(stationId);
    setIsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CRow className="flex-grow-1" xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="d-flex flex-column h-100 p-0 pb-3">
            <StickyContainer ref={titleRef} style={{ top: `${headerHeight}px` }}>
              <CCardTitle
                className="p-3 shadow-sm"
                style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
              >
                Stations Monitor
              </CCardTitle>
            </StickyContainer>
            <StationMonitorListView
              refHeight={listRefHeight}
              handleViewStation={handleViewStation}
            />
          </CCardBody>
        </CCol>
        <CCol md={6} lg={7}>
          <StationMonitorMapView handleViewStation={handleViewStation} />
        </CCol>
      </CRow>
      {isModalOpen && (
        <StationMonitorDetailsModal
          stationId={stationId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </CCard>
  );
};

export default StationMonitor;
