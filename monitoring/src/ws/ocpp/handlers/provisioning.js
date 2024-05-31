const provisioning = {};

provisioning.bootNotificationResponse = async () => {
  return {
    status: "Accepted",
    interval: 300,
    currentTime: new Date().toISOString(),
  };
};

export default provisioning;
