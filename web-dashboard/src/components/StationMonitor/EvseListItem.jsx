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
          disabled={!isSocketReady || isDisabled}
        >
          Remote Start
        </CButton>
        <CButton
          variant="outline"
          color="info"
          onClick={() => remoteStop(stationId, evseId)}
          disabled={!isSocketReady || isDisabled}
        >
          Remote Stop
        </CButton>
      </div>
    </div>
  );
};

export default StationMonitorEvseListItem;
