import StationStatus from "../../../repositories/station-status.js";

const availability = {};

availability.statusNotificationResponse = async ({ client, params }) => {
  const evse = client.session.evses[params.evseId - 1];
  await StationStatus.upsertStatus({
    stationId: evse.station_id,
    evseId: params.evseId,
    connectorId: params.connectorId,
    status: params.connectorStatus,
    rdbId: evse.id,
    siteId: evse.site_id,
    ownerId: evse.owner_id,
    latitude: evse.latitude,
    longitude: evse.longitude,
    createdAt: evse.created_at,
    updatedAt: params.timestamp,
  });
  return {};
};

availability.heartbeatResponse = async () => {
  return { currentTime: new Date().toISOString() };
};

export default availability;
