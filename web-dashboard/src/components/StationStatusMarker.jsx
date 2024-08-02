import { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Marker, Tooltip } from "react-leaflet";

import { stationStatusIcon } from "assets/mapIcons";
import {
  stationGetById,
  selectStationById,
  selectStationStatusById,
} from "redux/station/stationSlide";

const StationStatusMarker = ({ stationId, onClick }) => {
  const station = useSelector((state) => selectStationById(state, stationId));
  const stationStatus = useSelector((state) => selectStationStatusById(state, stationId));

  const {
    name,
    latitude,
    longitude,
    street_address,
    city,
    state,
    zip_code,
    country,
  } = useMemo(() => (station), [station]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!station) {
      dispatch(stationGetById(stationId));
    }
  }, [stationId, station, dispatch]);

  return (
    <Marker
      position={[latitude, longitude]}
      icon={stationStatusIcon(stationStatus)}
      eventHandlers={{ click: onClick }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
        <div>{`Station: ${name}`}</div>
        <div>{`Status: ${stationStatus}`}</div>
        <div>{`${street_address}, ${city}, ${state} ${zip_code}, ${country}`}</div>
      </Tooltip>
    </Marker>
  );
};

export default StationStatusMarker;
