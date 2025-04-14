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
import DriverStationListView from "components/DriverStation/ListView";
import DriverStationMapView from "components/DriverStation/MapView";
import DriverStationDetailsModal from "components/DriverStation/DetailsModal";
import useStationEventSocket from "hooks/useStationEventSocket";
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
import {
  evseStateClear,
  evseStateDeleteMany,
  selectEvseList,
} from "redux/evse/evseSlice";
import {
  evseStatusStateUpsertMany,
  evseStatusStateUpsertById,
  evseStatusStateDeleteMany,
  evseStatusStateClear,
  selectEvseStatusList,
  selectEvseStatusEntities,
} from "redux/evse/evseStatusSlice";
import utils from "utils";

const DriverStation = () => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);

  const stationIds = useSelector(selectStationIds);
  const stationList = useSelector(selectStationList);
  const evseList = useSelector(selectEvseList);
  const evseStatusList = useSelector(selectEvseStatusList);
  const evseStatusEntities = useSelector(selectEvseStatusEntities);

  const [titleHeight, setTitleHeight] = useState(0);
  const titleRef = useCallback((node) => {
    setTitleHeight(node?.getBoundingClientRect().height);
  }, []);

  const listRefHeight = useMemo(() => {
    return headerHeight + titleHeight;
  }, [headerHeight, titleHeight]);

  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [stationId, setStationId] = useState(null);

  const dispatch = useDispatch();

  const {
    isSocketOpen,
    watchStatusEventStart,
    watchStatusEventStop,
  } = useStationEventSocket({
    onWatchStatusEvent: useCallback(({ stationId, payload }) => {
      const { evseId, connectorStatus } = payload;
      if (evseId) {
        dispatch(evseStatusStateUpsertById({
          stationId, evseId,
          status: connectorStatus,
        }));
      } else if (evseStatusEntities[stationId]) {
        dispatch(evseStatusStateUpsertMany(
          evseStatusEntities[stationId].map(({ evseId }) => ({
            stationId, evseId,
            status: connectorStatus,
          }))
        ));
      }
    }, [evseStatusEntities, dispatch]),
    batchUpdate: true,
  });

  useEffect(() => {
    if (isSocketOpen && stationIds.length !== 0) {
      watchStatusEventStart(stationIds);
    }
    return () => {
      if (isSocketOpen) {
        watchStatusEventStop();
      }
    };
  }, [stationIds, isSocketOpen, watchStatusEventStart, watchStatusEventStop]);

  useEffect(() => {
    const stationIds = utils.outOfBoundResources(stationList, {
      lowerBound: mapLowerBound,
      upperBound: mapUpperBound,
    }).map(({ id }) => id);
    dispatch(stationStateDeleteMany(stationIds));
  }, [stationList, mapLowerBound, mapUpperBound, dispatch]);

  useEffect(() => {
    const evseIds = utils.outOfBoundResources(evseList, {
      lowerBound: mapLowerBound,
      upperBound: mapUpperBound,
    }).map(({ station_id, evse_id }) => ({ station_id, evse_id }));
    dispatch(evseStateDeleteMany(evseIds));
  }, [evseList, mapLowerBound, mapUpperBound, dispatch]);

  useEffect(() => {
    const evseStatusIds = utils.outOfBoundResources(evseStatusList, {
      lowerBound: mapLowerBound,
      upperBound: mapUpperBound,
    }).map(({ stationId, evseId }) => ({ stationId, evseId }));
    dispatch(evseStatusStateDeleteMany(evseStatusIds));
  }, [evseStatusList, mapLowerBound, mapUpperBound, dispatch]);

  useEffect(() => () => {
    dispatch(stationStateClear());
    dispatch(evseStateClear());
    dispatch(evseStatusStateClear());
  }, [dispatch]);

  const handleViewStation = (stationId) => {
    setStationId(stationId);
    setIsAnalyticsModalOpen(true);
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
                Stations
              </CCardTitle>
            </StickyContainer>
            <DriverStationListView
              refHeight={listRefHeight}
              handleViewStation={handleViewStation}
            />
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
