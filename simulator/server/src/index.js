import app from "./app.js"
import wss from "./wss.js";
import { PORT, STATION_IDENTITY, WEB_DOMAIN } from "./config.js";

app.listen(PORT, () => {
  console.log(`Simulation server running on port: ${PORT}`);
}).on("upgrade", (request, socket, head) => {
  const { headers: { origin }, url } = request;
  if (origin === WEB_DOMAIN && url === `/simulator/${STATION_IDENTITY}`) {
    wss.handleUpgrade(request, socket, head);
  } else {
    socket.destroy();
  }
});
