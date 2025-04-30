import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  AccessTimeOutlined,
  EvStationOutlined,
} from "@mui/icons-material";

import EvseAvailabilityStatus from "components/EvseAvailabilityStatus";
import LoadingIndicator from "components/LoadingIndicator";
import useFetchData from "hooks/useFetchData";
import useGetEvseStatusColor from "hooks/useGetEvseStatusColor";
import {
  stationGetById,
  selectStationById,
  selectStationStatusById,
} from "redux/station/stationSlice";
import utils from "utils";

const DriverStationListItem = ({ stationId, waitTime = 0 }) => {
  const station = useSelector((state) => selectStationById(state, stationId));
  const stationStatus = useSelector((state) => selectStationStatusById(state, stationId));

  const getColor = useGetEvseStatusColor();

  const hasDetails = useMemo(() => {
    const { name, street_address, city, state, zip_code } = station || {};
    return name && street_address && city && state && zip_code && stationStatus;
  }, [station, stationStatus]);

  const { loadState } = useFetchData({
    condition: !hasDetails,
    action: useCallback(() => stationGetById(stationId), [stationId]),
  });

  return (
    <div
      className="border rounded p-3 ps-2 my-1 shadow-sm"
      style={{ borderLeft: `9px solid var(--cui-${getColor(stationStatus)}) !important` }}
    >
      {loadState.loading
        ? <LoadingIndicator loading={loadState.loading} />
        : (
          <>
            <div className="d-flex justify-content-between">
              <div className={`d-flex align-items-center text-${getColor(stationStatus)}`}>
                <EvStationOutlined />
                <EvseAvailabilityStatus status={stationStatus} />
              </div>
              {station?.distance && (
                <span className="d-block text-secondary small">
                  {`${utils.kmToMi(station.distance).toFixed(2)} mi`}
                </span>
              )}
            </div>
            {waitTime !== 0 && (
              <div className={`${waitTime <= 15 ? "text-success" : waitTime <= 60 ? "text-warning" : "text-danger"} d-flex align-items-center`}>
                <AccessTimeOutlined fontSize="small" />
                <span className="small">{`Estimated wait: ${waitTime} minutes`}</span>
              </div>
            )}
            <span className="d-block text-secondary text-truncate small">
              {station.street_address}, {station.city}, {station.state} {station.zip_code}
            </span>
            <span className="d-block text-truncate ">{station.name}</span>
          </>
        )}
    </div>
  )
};

export default DriverStationListItem;

