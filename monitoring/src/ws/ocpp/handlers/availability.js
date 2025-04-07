import StationStatus from "../../../repositories/station-status.js";

const availability = {};

availability.statusNotificationResponse = async ({ client, params }) => {
  const { station } = client.session;
  await StationStatus.upsertStatus({
    stationId: station.id,
    evseId: params.evseId,
    connectorId: params.connectorId,
    status: params.connectorStatus,
    latitude: station.latitude,
    longitude: station.longitude,
    createdAt: station.created_at,
    updatedAt: params.timestamp,
  });
  return {};
};

availability.heartbeatResponse = async () => {
  return { currentTime: new Date().toISOString() };
};

export default availability;
