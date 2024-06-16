import StationStatus from "../../../repositories/station-status.js";

const availability = {};

availability.statusNotificationResponse = async ({ client, params }) => {
  await StationStatus.addStationStatus({
    stationId: client.identity,
    evseId: params.evseId,
    connectorId: params.connectorId,
    status: params.connectorStatus,
    timestamp: params.timestamp,
  });
  return {};
};

availability.heartbeatResponse = async () => {
  return { currentTime: new Date().toISOString() };
};

export default availability;
