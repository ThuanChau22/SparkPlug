import demoServer from "./demo/server.js";
import simulatorServer from "./simulator/server.js";

const webSocketApp = () => {
  const paramRegExp = /^:[\w\d]+$/;
  const routes = [];
  const use = (route, server) => {
    const s = route.split("/").reduce((acc, cur) => {
      return acc + (cur ? `/${paramRegExp.test(cur) ? "[\\w\\d]+" : cur}` : "");
    }, "");
    routes.push({ route, server, path: new RegExp(`^${s}[/]?$`) });
  };
  const parseParams = (route, pathname) => {
    const values = pathname.split("/");
    return route.split("/").reduce((acc, cur, i) => {
      if (!paramRegExp.test(cur)) return acc;
      return { ...acc, [cur.replace(":", "")]: values[i] };
    }, {});
  };
  const parseQuery = (searchParams) => {
    const query = {};
    for (const key of searchParams.keys()) {
      if (!query[key]) {
        const values = searchParams.getAll(key);
        query[key] = values.length === 1 ? values[0] : values;
      }
    }
    return query;
  };
  const handleUpgrade = (request, socket, head) => {
    const { url, headers: { host } } = request;
    const { pathname, searchParams } = new URL(url, `ws://${host}`);
    for (const { route, server, path } of routes) {
      if (path.test(pathname)) {
        request.params = parseParams(route, pathname);
        request.query = parseQuery(searchParams);
        return server.handleUpgrade(request, socket, head);
      }
    }
    return socket.destroy();
  };
  return { routes, use, handleUpgrade };
};

const app = webSocketApp();
app.use("/ws/simulator/demo", demoServer);
app.use("/ws/simulator/:id", simulatorServer);

export default app;
