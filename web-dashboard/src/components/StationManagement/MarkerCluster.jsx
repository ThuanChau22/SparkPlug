import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import stationIconUrl from "assets/station_pointer.png";
import MapMarker from "components/Map/MapMarker";
import MapMarkerCluster from "components/Map/MapMarkerCluster";
import {
  stationGetById,
  selectStationById,
} from "redux/station/stationSlice";
import utils from "utils";

export const StationMarker = ({ stationId, eventHandlers = {} }) => {
  const station = useSelector((state) => selectStationById(state, stationId));

  const dispatch = useDispatch();

  const {
    latitude, longitude,
    name, street_address, city,
  } = useMemo(() => station || { station }, [station]);

  const hasPosition = useMemo(() => (
    utils.hasLatLngValue({
      lat: latitude,
      lng: longitude,
    })
  ), [latitude, longitude]);

  const hasDetails = useMemo(() => (
    name && street_address && city
  ), [name, street_address, city]);

  return hasPosition && (
    <MapMarker
      iconUrl={stationIconUrl}
      position={[latitude, longitude]}
      eventHandlers={{
        mouseover: () => {
          if (!hasDetails) {
            dispatch(stationGetById(stationId));
          }
        },
        ...eventHandlers,
      }}
    >
      {hasDetails && (
        <>
          <p className="mb-0 text-secondary">
            {`ID: ${stationId}`}
          </p>
          <p className="mb-0 text-secondary small">
            {street_address}, {city}
          </p>
          <p className="mb-0">{name}</p>
        </>
      )}
    </MapMarker>
  );
};

const StationMarkerCluster = ({
  stationList = [],
  loading = false,
  onClick = () => { },
}) => (
  <MapMarkerCluster
    disableRefresh={loading}
    data={utils.toGeoJSON(stationList)}
    createMarker={({ properties: { id } }) => (
      <StationMarker
        key={id}
        stationId={id}
        eventHandlers={{ click: () => onClick(id) }}
      />
    )}
  />
);

export default StationMarkerCluster;
