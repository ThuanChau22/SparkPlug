import { useCallback, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import StationMonitorEventList from "components/StationMonitor/EventList";
import StationMonitorEvseList from "components/StationMonitor/EvseList";
import useFetchData from "hooks/useFetchData";
import useMapZoom from "hooks/useMapZoom";
import useStationEventSocket from "hooks/useStationEventSocket";
import { selectAuthRoleIsStaff } from "redux/auth/authSlice";
import {
  stationGetById,
  selectStationById,
} from "redux/station/stationSlice";

const StationMonitorDetailsModal = ({ isOpen, onClose, stationId }) => {
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const station = useSelector((state) => selectStationById(state, stationId));

  const fetchOnLoad = useMemo(() => {
    const { name, owner_id, latitude, longitude } = station || {};
    return !name || !owner_id || !latitude || !longitude;
  }, [station]);

  const { loadState } = useFetchData({
    condition: fetchOnLoad,
    action: useCallback(() => stationGetById(stationId), [stationId]),
  });

  useMapZoom({
    lat: station.latitude,
    lng: station.longitude,
  });

  const { isSocketOpen, watchAllEvent } = useStationEventSocket();

  useEffect(() => {
    if (isSocketOpen) {
      watchAllEvent(stationId);
    }
  }, [isSocketOpen, watchAllEvent, stationId]);

  return (
    <CModal
      size="lg"
      alignment="center"
      backdrop="static"
      visible={isOpen}
      onClose={onClose}
      scrollable
    >
      <CModalHeader className="mb-2">
        <CModalTitle>{!loadState.loading && station.name}</CModalTitle>
      </CModalHeader>
      {loadState.loading
        ? <LoadingIndicator loading={loadState.loading} />
        : (
          <>
            <p className="ps-3 mb-0">
              <span className="text-secondary" >Station ID: {station.id}</span>
              {authIsAdmin && (
                <span className="text-secondary float-end pe-3">
                  Owner ID: {station.owner_id}
                </span>
              )}
            </p>
            <CModalBody>
              <StationMonitorEvseList
                stationId={stationId}
              />
              <StationMonitorEventList
                stationId={stationId}
              />
            </CModalBody>
          </>
        )}
    </CModal>
  );
};

export default StationMonitorDetailsModal;
