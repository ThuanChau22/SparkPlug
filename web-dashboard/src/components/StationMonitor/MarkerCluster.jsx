import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import availableStationIconUrl from "assets/station_pointer_green.png";
import occupiedStationIconUrl from "assets/station_pointer_yellow.png";
import faultedStationIconUrl from "assets/station_pointer_red.png";
import unavailableStationIconUrl from "assets/station_pointer_gray.png";
import MapMarker from "components/Map/MapMarker";
import MapMarkerCluster from "components/Map/MapMarkerCluster";
import {
  stationGetById,
  selectStationById,
} from "redux/station/stationSlice";
import { selectStationStatusById } from "redux/station/stationSlice";
import {
  EvseStatus,

  selectEvseStatusEntities

} from "redux/evse/evseStatusSlice";
import utils from "utils";

const EvseStatusColors = {
  [EvseStatus.Available]: "var(--cui-success)",
  [EvseStatus.Occupied]: "var(--cui-warning)",
  [EvseStatus.Reserved]: "var(--cui-info)",
  [EvseStatus.Faulted]: "var(--cui-danger)",
  [EvseStatus.Unavailable]: "var(--cui-secondary)",
};

const StationStatusMarker = ({ stationId, eventHandlers = {} }) => {
  const station = useSelector((state) => selectStationById(state, stationId));
  const stationStatus = useSelector((state) => selectStationStatusById(state, stationId));

  const dispatch = useDispatch();

  const {
    latitude, longitude,
    name, street_address, city,
  } = useMemo(() => station || {}, [station]);

  const hasPosition = useMemo(() => utils.hasLatLngValue({
    lat: latitude,
    lng: longitude,
  }), [latitude, longitude]);

  const hasDetails = useMemo(() => (
    name && street_address && city
  ), [name, street_address, city]);

  return hasPosition && (
    <MapMarker
      iconUrl={
        stationStatus === EvseStatus.Available
          ? availableStationIconUrl
          : stationStatus === EvseStatus.Occupied
            ? occupiedStationIconUrl
            : stationStatus === EvseStatus.Faulted
              ? faultedStationIconUrl
              : unavailableStationIconUrl
      }
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
          <p className="mb-0">{`Status: ${stationStatus}`}</p>
        </>
      )}
    </MapMarker>
  );
};

const StationStatusMarkerCluster = ({
  stationList = [],
  loading = false,
  onClick = () => { },
}) => {
  const evseStatusEntities = useSelector(selectEvseStatusEntities);
  const stationStatusList = useMemo(() => (
    stationList.map((station) => (
      { ...station, evses: evseStatusEntities[station.id] }
    ))
  ), [stationList, evseStatusEntities]);

  return (
    <MapMarkerCluster
      data={utils.toGeoJSON(stationStatusList)}
      options={{
        disableRefresh: loading,
        map: ({ evses }) => {
          // Determine evse status count
          const countByStatus = { Total: 0 };
          for (const status of Object.values(EvseStatus)) {
            countByStatus[status] = 0;
          }
          for (const { status } of evses || []) {
            countByStatus[status] += 1;
            countByStatus.Total++;
          }
          return { ...countByStatus };
        },
        reduce: (accumulated, properties) => {
          // Accumulate evse status count
          accumulated.Total += properties.Total;
          for (const status of Object.values(EvseStatus)) {
            accumulated[status] += properties[status];
          }
        }
      }}
      createMarker={({ properties: { id } }) => (
        <StationStatusMarker
          key={id}
          stationId={id}
          eventHandlers={{ click: () => onClick(id) }}
        />
      )}
      customizeClusterIcon={({ properties }) => {
        // Modify icon style
        let gradients = `${EvseStatusColors[EvseStatus.Unavailable]} 0% 100%`;
        const count = properties.Total;
        if (count) {
          const percentages = [0];
          for (const status of Object.values(EvseStatus)) {
            const fraction = (properties[status] || 0) * 100 / count;
            percentages.push(fraction + percentages[percentages.length - 1]);
          }
          gradients = Object.values(EvseStatus).map((status, i) => (
            `${EvseStatusColors[status]} ${percentages[i]}% ${percentages[i + 1]}%`
          )).join();
        }
        const style = { icon: { background: `conic-gradient(${gradients})` } };
        // Add tooltip
        const tooltip = (
          <>
            {Object.values(EvseStatus)
              .filter((status) => properties[status])
              .map((status) => (
                <span
                  key={status}
                  className="d-block"
                  style={{ color: EvseStatusColors[status] }}
                >
                  {status}: {properties[status]}
                </span>
              ))}
          </>
        );
        return { count, style, tooltip };
      }}
    />
  );
};

export default StationStatusMarkerCluster;
