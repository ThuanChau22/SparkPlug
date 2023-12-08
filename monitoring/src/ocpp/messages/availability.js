import { Monitoring } from "../../db/model.js";

const availability = {};

availability.statusNotificationResponse = async ({ client, method, params }) => {
  await Monitoring.add({
    stationId: client.identity,
    event: method,
    payload: params,
  });
  return {};
};

availability.heartbeatResponse = async ({ client, method, params }) => {
  await Monitoring.add({
    stationId: client.identity,
    event: method,
    payload: params,
  });
  return { currentTime: new Date().toISOString() };
};

export default availability;
