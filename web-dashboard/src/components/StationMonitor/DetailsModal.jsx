import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import StationMonitorEventList from "components/StationMonitor/EventList";
import StationMonitorEvseList from "components/StationMonitor/EvseList";
import useStationEventSocket, { Action } from "hooks/useStationEventSocket";
import { selectAuthRoleIsStaff } from "redux/auth/authSlice";
import {
  stationGetById,
  selectStationById,
} from "redux/station/stationSlice";

const StationMonitorDetailsModal = ({ isOpen, onClose, stationId }) => {
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const station = useSelector((state) => selectStationById(state, stationId));

  const [loading, setLoading] = useState(false);

  useStationEventSocket({
    action: Action.WatchAllEvent,
    payload: { stationId },
  });

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (!station) {
      setLoading(true);
      await dispatch(stationGetById(stationId)).unwrap();
      setLoading(false);
    }
  }, [stationId, station, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <CModalTitle>{!loading && station.name}</CModalTitle>
      </CModalHeader>
      {loading
        ? <LoadingIndicator loading={loading} />
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
