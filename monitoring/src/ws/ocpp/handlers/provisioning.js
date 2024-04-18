import Monitoring from "../../../repository/monitoring.js";

const provisioning = {};

provisioning.bootNotificationResponse = async (client, { method, params }) => {
  await Monitoring.addEvent({
    stationId: client.identity,
    event: method,
    payload: params,
  });
  return {
    status: "Accepted",
    interval: 300,
    currentTime: new Date().toISOString(),
  };
};

export default provisioning;
