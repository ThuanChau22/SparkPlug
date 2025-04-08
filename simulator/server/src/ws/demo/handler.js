import axios from "axios";
import WebSocket from "ws";
import ms from "ms";

import { PORT, STATION_API_ENDPOINT } from "../../config.js";
import utils from "../../utils.js";
import { Action as Simulator } from "../simulator/handler.js";
import server, { state } from "./server.js";

export const Action = {
  START: "Start",
  PROGRESS: "Progress",
  STOP: "Stop",
};

const handler = {};

handler.simulate = (stationId, evseIds) => {
  const { stations, evses, flowCtrl } = state;

  const ws = new WebSocket(`ws://localhost:${PORT}/ws/simulator/${stationId}`);
  utils.prepareWebSocket(ws);
  ws.onJsonMessage(({ action, payload: { status, ...data } }) => {
    if (action === Simulator.SYNCED) {
      ws.sendJson({
        action: Simulator.CONNECT_CSMS,
        payload: {},
      });
    }

    if (action === Simulator.CONNECT_CSMS && status === "Accepted") {
      if (state.status === state.STOPPING) {
        for (const evseId of evseIds) {
          flowCtrl.queue.delete(`${stationId},${evseId}`);
        }
        flowCtrl.queue.add(stationId);
        return ws.sendJson({
          action: Simulator.DISCONNECT_CSMS,
          payload: {},
        });
      }
      stations.set(stationId, ws);
      for (const evseId of evseIds) {
        const availability = utils.randomize({
          "Available": 0.8,
          "Occupied": 0.2,
        });
        if (availability === "Occupied") {
          ws.sendJson({
            action: Simulator.PLUGIN_CABLE,
            payload: { evseId, connectorId: 1 },
          });
          continue;
        }
        flowCtrl.queue.delete(`${stationId},${evseId}`);
        evses.add(`${stationId},${evseId}`);
        const isStarted = evses.size === state.totalCount;
        state.status = isStarted ? state.STARTED : state.STARTING;
        server.wss.emit("progress");
      }
    }

    if (action === Simulator.PLUGIN_CABLE && status === "Accepted") {
      flowCtrl.queue.delete(`${stationId},${data.evseId}`);
      state.evses.add(`${stationId},${data.evseId}`);
      const isStarted = state.evses.size === state.totalCount;
      state.status = isStarted ? state.STARTED : state.STARTING;
      server.wss.emit("progress");
    }

    if (action === Simulator.DISCONNECT_CSMS && status === "Accepted") {
      stations.delete(stationId);
      for (const evseId of evseIds) {
        evses.delete(`${stationId},${evseId}`);
      }
      const isDeleted = flowCtrl.queue.delete(stationId);
      state.status = state.STOPPING;
      if (flowCtrl.queue.size === 0) {
        if (evses.size === 0) {
          state.status = state.IDLE;
          state.totalCount = 0;
        } else if (!isDeleted) {
          state.status = state.STARTED;
          state.totalCount = evses.size;
        }
      }
      server.wss.emit("progress");
      ws.close();
    }
  });
};

handler.start = (payload) => {
  try {
    if (state.status !== state.IDLE) {
      throw new Error("Invalid state to start");
    }
    server.wss.emit("starting", payload);
    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.starting = async (payload) => {
  try {
    state.status = state.STARTING;
    server.wss.emit("progress");

    const endpoint = `${STATION_API_ENDPOINT}/evses`;
    const entries = Object.entries({
      limit: 100,
      ...payload,
      fields: "station_id,evse_id",
    });
    const filtered = entries.filter(([_, value]) => value);
    const params = filtered.map(([key, value]) => `${key}=${value}`).join("&");
    const { data } = await axios.get(`${endpoint}${params ? `?${params}` : ""}`);
    const { data: evses } = data;
    state.totalCount = evses.length;

    const evsesByStations = new Map();
    for (const { station_id, evse_id } of evses) {
      if (!evsesByStations.has(station_id)) {
        evsesByStations.set(station_id, []);
      }
      evsesByStations.get(station_id).push(evse_id);
    }

    const { flowCtrl } = state;
    const iterator = evsesByStations.entries();
    let entry = iterator.next();
    while (!entry.done && state.status === state.STARTING) {
      if (flowCtrl.queue.size > flowCtrl.limit) {
        await utils.sleep(ms(`${flowCtrl.waitTime}s`));
        flowCtrl.waitTime *= 2;
        continue;
      }
      flowCtrl.waitTime = 1;

      const [stationId, evseIds] = entry.value;
      for (const evseId of evseIds) {
        flowCtrl.queue.add(`${stationId},${evseId}`);
      }
      handler.simulate(stationId, evseIds);

      entry = iterator.next();
    }
  } catch (error) {
    state.status = state.STARTED;
    server.wss.emit("progress");
    console.log(error);
  }
}

handler.stop = () => {
  try {
    const { IDLE, STOPPING, status } = state;
    if (status === IDLE || status === STOPPING) {
      throw new Error("Invalid state to stop");
    }
    server.wss.emit("stopping");
    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.stopping = async () => {
  try {
    state.status = state.STOPPING;
    server.wss.emit("progress");

    const { stations, flowCtrl } = state;
    const iterator = stations.entries();
    let entry = iterator.next();
    let isInitialized = false;
    while (!entry.done) {
      if (isInitialized && flowCtrl.queue.size > flowCtrl.limit) {
        await utils.sleep(ms(`${flowCtrl.waitTime}s`));
        flowCtrl.waitTime *= 2;
        continue;
      }
      isInitialized = true;
      flowCtrl.waitTime = 1;

      const [stationId, socket] = entry.value;
      flowCtrl.queue.add(stationId);
      const action = Simulator.DISCONNECT_CSMS;
      socket.sendJson({ action, payload: {} });

      entry = iterator.next();
    }
  } catch (error) {
    state.status = state.IDLE;
    server.wss.emit("progress");
    console.log(error);
  }
};

export default handler;
