import { useMemo } from "react";
import { useSelector } from "react-redux";
import cryptoJs from "crypto-js";

import availableStationIconUrl from "assets/station_pointer_green.png";
import occupiedStationIconUrl from "assets/station_pointer_yellow.png";
import faultedStationIconUrl from "assets/station_pointer_red.png";
import unavailableStationIconUrl from "assets/station_pointer_gray.png";
import MapMarker from "components/Map/MapMarker";
import MapMarkerCluster from "./MapMarkerCluster";
import { selectStationStatusById } from "redux/station/stationSlice";
import {
  EvseStatus,
  selectEvseStatusByStation,
} from "redux/evse/evseStatusSlice";

const Colors = {
  [EvseStatus.Available]: "var(--cui-success)",
  [EvseStatus.Occupied]: "var(--cui-warning)",
  [EvseStatus.Reserved]: "var(--cui-info)",
  [EvseStatus.Faulted]: "var(--cui-danger)",
  [EvseStatus.Unavailable]: "var(--cui-secondary)",
};

const StationStatusMarker = ({ station, onClick }) => {
  const stationStatus = useSelector((state) => selectStationStatusById(state, station.id));
  const evseStatusList = useSelector((state) => selectEvseStatusByStation(state, station.id));

  // Dirty effort to force refresh leaflet cluster marker
  const mutateKey = useMemo(() => {
    const reducer = (key, { status }) => `${key}-${status}`;
    const key = evseStatusList.reduce(reducer, `${station.id}`);
    return cryptoJs.SHA256(key).toString();
  }, [station.id, evseStatusList]);

  const {
    name, latitude, longitude,
    street_address, city, state, zip_code, country,
  } = station;

  return (
    <MapMarker
      key={mutateKey}
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
      eventHandlers={onClick ? { click: onClick } : {}}
      evseStatusList={evseStatusList}
    >
      <div>{`Station: ${name}`}</div>
      <div>{`Status: ${stationStatus}`}</div>
      <div>{`${street_address}, ${city}, ${state} ${zip_code}, ${country}`}</div>
    </MapMarker>
  );
};

const StationStatusMarkerCluster = ({ stationList = [], onClick = null }) => (
  <MapMarkerCluster
    customizeIcon={(cluster) => {
      // Determine evse status count
      let count = 0;
      const statuses = {};
      for (const marker of cluster.getAllChildMarkers()) {
        const { evseStatusList } = marker.options;
        for (const { status } of evseStatusList) {
          statuses[status] = statuses[status] + 1 || 1;
          count++;
        }
      }
      // Modify icon style
      const percentages = [0];
      for (const status of Object.values(EvseStatus)) {
        const fraction = (statuses[status] || 0) * 100 / count;
        percentages.push(fraction + percentages[percentages.length - 1]);
      }
      const background = `conic-gradient(
        ${Object.values(EvseStatus).map((status, i) => (
        `${Colors[status]} ${percentages[i]}% ${percentages[i + 1]}%`
      )).join()}
      )`;
      const style = { icon: { background } };
      // Add tooltip
      const tooltip = (
        <>
          {Object.values(EvseStatus)
            .filter((status) => statuses[status])
            .map((status) => (
              <span
                key={status}
                className="d-block"
                style={{ color: Colors[status] }}
              >
                {status}: {statuses[status]}
              </span>
            ))}
        </>
      );
      return { count, style, tooltip };
    }}
  >
    {stationList.map((station) => (
      <StationStatusMarker
        key={station.id}
        station={station}
        onClick={onClick ? () => onClick(station.id) : null}
      />
    ))}
  </MapMarkerCluster>
);

export default StationStatusMarkerCluster;
