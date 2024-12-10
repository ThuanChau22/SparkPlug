import axios from "axios";

import { STATION_API_ENDPOINT } from "../../../config.js";
import StationStatus from "../../../repositories/station-status.js";

const availability = {};

availability.statusNotificationResponse = async ({ client, params }) => {
  const { data } = await axios.get(`${STATION_API_ENDPOINT}/${client.identity}`);
  await StationStatus.addStationStatus({
    stationId: client.identity,
    evseId: params.evseId,
    connectorId: params.connectorId,
    status: params.connectorStatus,
    timestamp: params.timestamp,
    site_id: data.site_id,
    owner_id: data.owner_id,
    latitude: data.latitude,
    longitude: data.longitude,
    created_at: data.created_at,
  });
  return {};
};

availability.heartbeatResponse = async () => {
  return { currentTime: new Date().toISOString() };
};

export default availability;
