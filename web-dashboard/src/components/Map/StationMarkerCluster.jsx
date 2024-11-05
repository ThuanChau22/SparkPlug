import stationIconUrl from "assets/station_pointer.png";
import MapMarker from "components/Map/MapMarker";
import MapMarkerCluster from "components/Map/MapMarkerCluster";

const StationMarker = ({ station, onClick }) => {
  const {
    name, site_id, latitude, longitude,
    street_address, city, state, zip_code, country,
  } = station;
  return (
    <MapMarker
      iconUrl={stationIconUrl}
      position={[latitude, longitude]}
      eventHandlers={onClick ? { click: onClick } : {}}
    >
      <div>{`Station: ${name}`}</div>
      <div>{`Site ID: ${site_id}`}</div>
      <div>{`${street_address}, ${city}, ${state} ${zip_code}, ${country}`}</div>
    </MapMarker>
  );
};

const StationMarkerCluster = ({ stationList = [], onClick = null }) => (
  <MapMarkerCluster>
    {stationList.map((station) => (
      <StationMarker
        key={station.id}
        station={station}
        onClick={onClick ? () => onClick(station.id) : null}
      />
    ))}
  </MapMarkerCluster>
);

export default StationMarkerCluster;
