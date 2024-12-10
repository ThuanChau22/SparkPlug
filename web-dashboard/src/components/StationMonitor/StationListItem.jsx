import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";

import EvseAvailabilityStatus from "components/EvseAvailabilityStatus";
import LoadingIndicator from "components/LoadingIndicator";
import useFetchData from "hooks/useFetchData";
import {
  stationGetById,
  selectStationById,
  selectStationStatusById,
} from "redux/station/stationSlice";

const StationMonitorListItem = ({ stationId }) => {
  const station = useSelector((state) => selectStationById(state, stationId));
  const stationStatus = useSelector((state) => selectStationStatusById(state, stationId));

  const hasDetails = useMemo(() => {
    const { name, street_address, city } = station || {};
    return name && street_address && city && stationStatus;
  }, [station, stationStatus]);

  const { loadState } = useFetchData({
    condition: !hasDetails,
    action: useCallback(() => stationGetById(stationId), [stationId]),
  });

  return (loadState.loading
    ? <LoadingIndicator loading={loadState.loading} />
    : (
      <>
        <div>
          <p className="mb-0 text-secondary">
            {`ID: ${stationId}`}
          </p>
          <p className="mb-0 text-secondary small">
            {station.street_address}, {station.city}
          </p>
          <p className="mb-0">{station.name}</p>
        </div>
        <EvseAvailabilityStatus status={stationStatus} />
      </>
    )
  );
};

export default StationMonitorListItem;
