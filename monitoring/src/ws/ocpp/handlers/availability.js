import Station from "../../../repository/station.js";

const availability = {};

availability.statusNotificationResponse = async ({ client, params }) => {
  await Station.updateStatus(client.identity, params.connectorStatus);
  return {};
};

availability.heartbeatResponse = async () => {
  return { currentTime: new Date().toISOString() };
};

export default availability;
