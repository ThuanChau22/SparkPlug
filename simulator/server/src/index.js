import { connectCSMS } from "./ocpp/client.js";
import wss from "./ws/server.js";
import app from "./app.js"
import { PORT, STATION_IDENTITY, WEB_DOMAIN } from "./config.js";

app.listen(PORT, async () => {
  try {
    console.log(`Simulation server running on port: ${PORT}`);
    await connectCSMS();
  } catch (error) {
    console.log(error);
  }
}).on("upgrade", (request, socket, head) => {
  const { headers: { origin }, url } = request;
  if (origin === WEB_DOMAIN && url === `/simulator/${STATION_IDENTITY}`) {
    wss.handleUpgrade(request, socket, head);
  } else {
    socket.destroy();
  }
});
