const provisioning = {};

provisioning.bootNotificationResponse = ({ client, params }) => {
  console.log(`BootNotification from ${client.identity}:`, params);
  return {
    status: "Accepted",
    interval: 300,
    currentTime: new Date().toISOString(),
  };
};

export default provisioning;
