import existedStationIconUrl from "assets/station_pointer.png";
import predictedStationIconUrl from "assets/station_pointer_yellow.png";
import MapMarker from "components/Map/MapMarker";
import MapMarkerCluster from "components/Map/MapMarkerCluster";

const StationPredictionMarker = ({ station, onClick }) => {
  const {
    id, name, site_id, latitude, longitude,
    street_address, city, state, zip_code, country,
  } = station;
  return (
    <MapMarker
      iconUrl={id ? existedStationIconUrl : predictedStationIconUrl}
      position={[latitude, longitude]}
      eventHandlers={onClick ? { click: onClick } : {}}
      station={station}
    >
      {!id
        ? (<>{latitude}, {longitude}</>)
        : (
          <>
            <div>{`Station: ${name}`}</div>
            <div>{`Site ID: ${site_id}`}</div>
            <div>{`${street_address}, ${city}, ${state} ${zip_code}, ${country}`}</div>
          </>
        )
      }
    </MapMarker>
  );
};

const StationPredictionMarkerCluster = ({ stationList = [], onClick = null }) => (
  <MapMarkerCluster
    customizeIcon={(cluster) => {
      // Get existed and predicted stations count
      const stationCategories = {
        existing: {
          color: "#7666f7",
          count: 0,
        },
        predicted: {
          color: "var(--cui-warning)",
          count: 0,
        },
      };
      for (const marker of cluster.getAllChildMarkers()) {
        const { station } = marker.options;
        stationCategories[station.id ? "existing" : "predicted"].count++;
      }
      // Modify icon style
      const percentages = [0];
      const total = cluster.getChildCount();
      for (const { count } of Object.values(stationCategories)) {
        const fraction = (count || 0) * 100 / total;
        percentages.push(fraction + percentages[percentages.length - 1]);
      }
      const background = `conic-gradient(
        ${Object.values(stationCategories).map(({ color }, i) => (
        `${color} ${percentages[i]}% ${percentages[i + 1]}%`
      )).join()}
      )`;
      const style = { icon: { background } };
      // Add tooltip
      const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
      const tooltip = (
        <>
          {Object.entries(stationCategories)
            .map(([category, { color, count }]) => (
              <span
                key={category}
                className="d-block"
                style={{ color }}
              >
                {capitalize(category)} Station: {count}
              </span>
            ))}
        </>
      );
      return { style, tooltip }
    }}
  >
    {stationList.map((station) => (
      <StationPredictionMarker
        key={station.id || `${station.latitude},${station.longitude}`}
        station={station}
        onClick={onClick ? () => onClick(station.id) : null}
      />
    ))}
  </MapMarkerCluster>
);

export default StationPredictionMarkerCluster;
