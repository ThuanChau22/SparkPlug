import axios from "axios";

import { STATION_API_ENDPOINT } from "../../../config.js";
import StationStatus from "../../../repositories/station-status.js";

const availability = {};

availability.statusNotificationResponse = async ({ client, params }) => {
  const { data } = await axios.get(`${STATION_API_ENDPOINT}/${client.identity}`);
  await StationStatus.upsertStatus({
    stationId: data.id,
    evseId: params.evseId,
    connectorId: params.connectorId,
    status: params.connectorStatus,
    latitude: data.latitude,
    longitude: data.longitude,
    createdAt: data.created_at,
    updatedAt: params.timestamp,
  });
  return {};
};

availability.heartbeatResponse = async () => {
  return { currentTime: new Date().toISOString() };
};

export default availability;
