const availability = {};

availability.statusNotificationResponse = ({ client, params }) => {
  console.log(`StatusNotification from ${client.identity}:`, params);
  return {};
};

availability.heartbeatResponse = ({ client, params }) => {
  console.log(`Heartbeat from ${client.identity}:`, params);
  return { currentTime: new Date().toISOString() };
};

export default availability;
