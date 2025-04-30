import { useCallback, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
} from "@coreui/react";

import DriverStationListView from "components/DriverStation/ListView";
import DriverStationMapView from "components/DriverStation/MapView";
import DriverStationDetailsModal from "components/DriverStation/DetailsModal";
import useStationEventSocket from "hooks/useStationEventSocket";
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
  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);

  const stationIds = useSelector(selectStationIds);
  const stationList = useSelector(selectStationList);
  const evseList = useSelector(selectEvseList);
  const evseStatusList = useSelector(selectEvseStatusList);
  const evseStatusEntities = useSelector(selectEvseStatusEntities);

  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [stationId, setStationId] = useState(null);

  const dispatch = useDispatch();

  const {
    isSocketReady,
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
    if (isSocketReady && stationIds.length !== 0) {
      watchStatusEventStart(stationIds);
    }
    return () => {
      if (isSocketReady) {
        watchStatusEventStop();
      }
    };
  }, [stationIds, isSocketReady, watchStatusEventStart, watchStatusEventStop]);

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

  const handleOpenViewModal = (stationId) => {
    setStationId(stationId);
    setIsAnalyticsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CCardBody className="d-flex flex-column h-100 p-0 pb-3">
        <CRow className="flex-grow-1" xs={{ gutterX: 0 }}>
          <CCol md={6} lg={5} xl={4}>
            <DriverStationListView
              title="Stations"
              openViewModal={handleOpenViewModal}
            />
          </CCol>
          <CCol md={6} lg={7} xl={8}>
            <DriverStationMapView openViewModal={handleOpenViewModal} />
          </CCol>
        </CRow>
      </CCardBody>
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
