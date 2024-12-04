import existedStationIconUrl from "assets/station_pointer.png";
import predictedStationIconUrl from "assets/station_pointer_yellow.png";
import MapMarker from "components/Map/MapMarker";
import MapMarkerCluster from "components/Map/MapMarkerCluster";
import utils from "utils";

const StationPredictionMarker = ({ station, eventHandlers = {} }) => {
  const {
    latitude, longitude,
    id, name, street_address, city
  } = station;
  return (
    <MapMarker
      iconUrl={id ? existedStationIconUrl : predictedStationIconUrl}
      position={[latitude, longitude]}
      eventHandlers={eventHandlers}
    >
      {!id
        ? (<>{latitude}, {longitude}</>)
        : (
          <>
            <p className="mb-0 text-secondary">
              {`ID: ${id}`}
            </p>
            <p className="mb-0 text-secondary small">
              {street_address}, {city}
            </p>
            <p className="mb-0">{name}</p>
          </>
        )
      }
    </MapMarker>
  );
};

const StationPredictionMarkerCluster = ({ stationList = [] }) => (
  <MapMarkerCluster
    data={utils.toGeoJSON(stationList)}
    options={{
      // Determine existed and predicted stations count
      map: ({ id }) => ({ existedCount: id ? 1 : 0 }),
      reduce: (accumulated, properties) => {
        // Accumulate existed and predicted stations count
        accumulated.existedCount += properties.existedCount;
      },
    }}
    createMarker={({ properties: station }) => (
      <StationPredictionMarker
        key={station.id || `${station.latitude},${station.longitude}`}
        station={station}
      />
    )}
    customizeClusterIcon={({ properties }) => {
      const { point_count: totalCount, existedCount } = properties;
      // Determine existed and predicted stations count
      const stationCategories = {
        existing: {
          color: "#7666f7",
          count: existedCount,
        },
        predicted: {
          color: "var(--cui-warning)",
          count: totalCount - existedCount,
        },
      };
      // Modify icon style
      const percentages = [0];
      for (const { count } of Object.values(stationCategories)) {
        const fraction = (count || 0) * 100 / totalCount;
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
  />
);

export default StationPredictionMarkerCluster;
