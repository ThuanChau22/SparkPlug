const provisioning = {};

provisioning.bootNotificationResponse = async ({ client }) => {
  const { ready, waitTime } = client.session;
  const response = {
    status: "Accepted",
    interval: 300,
    currentTime: new Date().toISOString(),
  }
  if (!ready) {
    response.status = "Pending";
    response.interval = waitTime;
    client.session.waitTime *= 2;
  }
  return response;
};

export default provisioning;
