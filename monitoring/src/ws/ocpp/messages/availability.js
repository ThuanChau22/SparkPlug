import { Monitoring } from "../../../repository/monitoring.js";
import { Station } from "../../../repository/station.js";

const availability = {};

availability.statusNotificationResponse = async ({ client, method, params }) => {
  await Station.updateStatus(client.identity, params.connectorStatus);
  await Monitoring.add({
    stationId: client.identity,
    event: method,
    payload: params,
  });
  return {};
};

availability.heartbeatResponse = async ({ client, method, params }) => {
  // await Monitoring.add({
  //   stationId: client.identity,
  //   event: method,
  //   payload: params,
  // });
  return { currentTime: new Date().toISOString() };
};

export default availability;
