import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import EvseAvailabilityStatus from "components/EvseAvailabilityStatus";
import LoadingIndicator from "components/LoadingIndicator";
import {
  stationGetById,
  selectStationById,
  selectStationStatusById,
} from "redux/station/stationSlice";

const DriverStationListItem = ({ stationId }) => {
  const station = useSelector((state) => selectStationById(state, stationId));
  const stationStatus = useSelector((state) => selectStationStatusById(state, stationId));

  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (!station) {
      setLoading(true);
      await dispatch(stationGetById(stationId)).unwrap()
      setLoading(false);
    }
  }, [stationId, station, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (loading
    ? <LoadingIndicator loading={loading} />
    : (
      <>
        <div>
          <small className="w-100 text-secondary">ID: {station.id}</small>
          <p className="mb-0">{station.name}</p>
        </div>
        <EvseAvailabilityStatus status={stationStatus} />
      </>
    )
  )
};

export default DriverStationListItem;

