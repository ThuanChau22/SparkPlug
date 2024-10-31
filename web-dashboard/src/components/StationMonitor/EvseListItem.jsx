import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ms from "ms";
import { CButton } from "@coreui/react";
import { EvStation } from '@mui/icons-material';

import EvseAvailabilityStatus from "components/EvseAvailabilityStatus";
import useStationEventSocket from "hooks/useStationEventSocket";
import {
  EvseStatus,
  evseStatusStateUpsertById,
  selectEvseStatusById,
} from "redux/evse/evseStatusSlice";

const StationMonitorEvseListItem = ({ stationId, evseId }) => {
  const evseStatus = useSelector((state) => selectEvseStatusById(state, {
    stationId,
    evseId,
  }));

  const { remoteStart, remoteStop } = useStationEventSocket();

  const meterTimeout = useRef({});

  const [meterValue, setMeterValue] = useState(evseStatus?.meterValue || 0);

  const isDisabled = useMemo(() => {
    const { Available, Occupied } = EvseStatus;
    return ![Available, Occupied].includes(evseStatus?.status);
  }, [evseStatus]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (evseStatus?.meterValue) {
      setMeterValue(evseStatus.meterValue);
      clearTimeout(meterTimeout.current);
      meterTimeout.current = setTimeout(() => {
        setMeterValue(0);
        dispatch(evseStatusStateUpsertById({
          station_id: evseStatus.station_id,
          evse_id: evseStatus.evse_id,
          meterValue: 0,
        }));
      }, ms("5s"));
    }
  }, [evseStatus, meterTimeout, dispatch]);

  return (
    <div className="d-flex justify-content-between">
      <p className="text-secondary my-auto">
        <span>EVSE ID: {evseId} - </span>
        <span className="fw-medium">
          <EvseAvailabilityStatus
            status={evseStatus?.status || EvseStatus.Unavailable}
          />
        </span>
      </p>
      <div className="d-flex align-items-center">
        <EvStation color="warning" />
        <h5 className="text-warning p-1 m-0">{meterValue}Wh</h5>
      </div>
      <div>
        <CButton
          className="me-1"
          variant="outline"
          color="success"
          onClick={() => remoteStart(stationId, evseId)}
          disabled={isDisabled}
        >
          Remote Start
        </CButton>
        <CButton
          variant="outline"
          color="info"
          onClick={() => remoteStop(stationId, evseId)}
          disabled={isDisabled}
        >
          Remote Stop
        </CButton>
      </div>
    </div>
  );
};

export default StationMonitorEvseListItem;
