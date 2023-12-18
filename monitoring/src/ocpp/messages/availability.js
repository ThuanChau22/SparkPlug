import { Monitoring } from "../../db/model.js";
import { updateStationStatus } from "../../db/repository.js";

const availability = {};

availability.statusNotificationResponse = async ({ client, method, params }) => {
  await updateStationStatus(client.identity, params.connectorStatus);
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
