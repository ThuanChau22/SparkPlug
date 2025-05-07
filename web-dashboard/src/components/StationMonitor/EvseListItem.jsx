import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { CButton } from "@coreui/react";
import { EvStation } from "@mui/icons-material";
import ms from "ms";

import EvseAvailabilityStatus from "components/EvseAvailabilityStatus";
import useStationEventSocket from "hooks/useStationEventSocket";
import {
  EvseStatus,
  selectEvseStatusById,
} from "redux/evse/evseStatusSlice";

const StationMonitorEvseListItem = ({ stationId, evseId }) => {
  const evseStatus = useSelector((state) => selectEvseStatusById(state, {
    stationId,
    evseId,
  }));

  const meterTimeoutRef = useRef({});

  const [meterValue, setMeterValue] = useState(evseStatus?.meterValue || 0);

  const isDisabled = useMemo(() => {
    const { Available, Occupied } = EvseStatus;
    return ![Available, Occupied].includes(evseStatus?.status);
  }, [evseStatus]);

  const { isSocketReady, remoteStart, remoteStop } = useStationEventSocket({
    onWatchAllEvent: useCallback((stationEvent) => {
      if (
        stationEvent.event === "TransactionEvent"
        && stationEvent.stationId === stationId
        && stationEvent.payload.evse.id === evseId
        && stationEvent.payload.meterValue
      ) {
        const [meter] = stationEvent.payload.meterValue;
        const [sample] = meter.sampledValue;
        setMeterValue(sample.value);
      }
    }, [stationId, evseId]),
  });

  useEffect(() => {
    if (meterValue) {
      clearTimeout(meterTimeoutRef.current);
      meterTimeoutRef.current = setTimeout(() => {
        setMeterValue(0);
      }, ms("5s"));
    }
  }, [meterValue, meterTimeoutRef]);

  useEffect(() => () => clearTimeout(meterTimeoutRef.current), []);

  return (
    <div className="d-flex justify-content-between align-items-center">
      <p className="text-secondary my-auto">
        <span>EVSE ID: {evseId}</span>
        <span className="d-none d-sm-inline"> - </span>
        <span className="d-block d-sm-inline fw-medium">
          <EvseAvailabilityStatus status={evseStatus?.status} />
        </span>
      </p>
      <div className="d-none d-sm-flex align-items-center">
        <EvStation color="warning" />
        <h5 className="text-warning p-1 m-0">{meterValue}Wh</h5>
      </div>
      <div>
        <div className="d-flex d-sm-none justify-content-between align-items-center">
          <EvStation color="warning" fontSize="small" />
          <span className="text-warning fw-medium p-1">{meterValue}Wh</span>
        </div>
        <CButton
          variant="outline"
          color="success"
          onClick={() => remoteStart(stationId, evseId)}
          disabled={!isSocketReady || isDisabled}
        >
          Start
        </CButton>
        <span className="me-1"></span>
        <CButton
          variant="outline"
          color="info"
          onClick={() => remoteStop(stationId, evseId)}
          disabled={!isSocketReady || isDisabled}
        >
          Stop
        </CButton>
      </div>
    </div>
  );
};

export default StationMonitorEvseListItem;
