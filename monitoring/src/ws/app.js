import monitoringServer from "./monitoring/server.js";
import ocppServer from "./ocpp/server.js";

const createWebSocketApp = () => {
  const routes = [];
  const use = (route, server) => {
    const s = route.split("/").reduce((acc, cur) => {
      return acc + (cur ? `/${/^:[\w\d]+$/.test(cur) ? "[\\w\\d]+" : cur}` : "");
    }, "");
    routes.push({ route: new RegExp(`^${s}[/]?$`), server });
  };
  const handleUpgrade = (request, socket, head) => {
    const { url, headers: { host } } = request;
    const { pathname } = new URL(url, `ws://${host}`);
    for (const { route, server } of routes) {
      if (route.test(pathname)) {
        return server.handleUpgrade(request, socket, head);
      }
    }
    return socket.destroy();
  };
  return { routes, use, handleUpgrade };
};

const app = createWebSocketApp();
app.use("/ws/monitoring", monitoringServer);
app.use("/ws/ocpp/:id", ocppServer);

export default app;
