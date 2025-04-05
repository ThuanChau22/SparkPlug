const provisioning = {};

provisioning.bootNotificationResponse = async () => ({
  status: "Accepted",
  interval: 300,
  currentTime: new Date().toISOString(),
});

export default provisioning;
