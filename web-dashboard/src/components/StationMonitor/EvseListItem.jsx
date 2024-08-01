import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ms from "ms";
import { CButton } from "@coreui/react";
import { EvStation } from '@mui/icons-material';

import AvailabilityStatus from "components/AvailabilityStatus";
import {
  evseStateUpsertById,
  selectEvseById,
} from "redux/evse/evseSlice";

const StationMonitorEvseListItem = ({ stationId, evseId, remoteStart, remoteStop }) => {
  const id = { stationId, evseId };
  const evse = useSelector((state) => selectEvseById(state, id));

  const meterTimeout = useRef(0)

  const [meterValue, setMeterValue] = useState(evse.meterValue || 0);

  const dispatch = useDispatch();

  useEffect(() => {
    if (evse.meterValue) {
      setMeterValue(evse.meterValue);
      clearTimeout(meterTimeout.current);
      meterTimeout.current = setTimeout(() => {
        setMeterValue(0);
        dispatch(evseStateUpsertById({
          station_id: evse.station_id,
          evse_id: evse.evse_id,
          meterValue: 0,
        }));
      }, ms("5s"));
    }
  }, [evse, meterTimeout, dispatch]);

  return (
    <div className="d-flex justify-content-between">
      <p className="text-secondary my-auto">
        <span>EVSE ID: {evseId} - </span>
        <span className="fw-medium">
          <AvailabilityStatus status={evse.status} />
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
          disabled={evse.status === "Unavailable"}
        >
          Remote Start
        </CButton>
        <CButton
          variant="outline"
          color="info"
          onClick={() => remoteStop(stationId, evseId)}
          disabled={evse.status === "Unavailable"}
        >
          Remote Stop
        </CButton>
      </div>
    </div>
  );
};

export default StationMonitorEvseListItem;
