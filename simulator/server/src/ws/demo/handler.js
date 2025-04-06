import axios from "axios";
import WebSocket from "ws";

import { PORT, STATION_API_ENDPOINT } from "../../config.js";
import utils from "../../utils.js";
import { Action as SimulatorAction } from "../simulator/handler.js";
import { state } from "./server.js";

export const Action = {
  SYNCED: "Synced",
  START: "Start",
  PROGRESS: "Progress",
  STOP: "Stop",
};

const handler = {};

handler.simulate = (stationId, evseIds) => {
  const { IDLE, STARTING, STARTED, STOPPING } = state;
  const { stations, eventEmitter, flowCtrl } = state;

  const url = `ws://localhost:${PORT}/ws/simulator/${stationId}`;
  const ws = new WebSocket(url);
  utils.prepareWebSocket(ws);
  ws.onJsonMessage(({ action, payload: { status } }) => {
    const { SYNCED, CONNECT_CSMS, DISCONNECT_CSMS, PLUGIN_CABLE } = SimulatorAction;
    if (action === SYNCED) {
      ws.sendJson({ action: CONNECT_CSMS, payload: {} });
    }
    if (action === CONNECT_CSMS && status === "Accepted") {
      flowCtrl.count -= flowCtrl.count - 1 < 0 ? 0 : 1;

      stations.set(stationId, ws);
      state.evseCount += evseIds.length;
      if (state.status === STOPPING) {
        flowCtrl.count++;
        return ws.sendJson({ action: DISCONNECT_CSMS, payload: {} });
      }
      const isDone = state.evseCount === state.totalCount;
      state.status = isDone ? STARTED : STARTING;
      eventEmitter.emit("progress", {
        status: state.status,
        evseCount: state.evseCount,
        totalCount: state.totalCount,
      });
      for (const evseId of evseIds) {
        const availability = utils.randomize({
          "Available": 0.8,
          "Occupied": 0.2,
        });
        if (availability === "Occupied") {
          flowCtrl.count++;
          ws.sendJson({
            action: PLUGIN_CABLE,
            payload: { evseId, connectorId: 1 },
          });
        }
      }
    }
    if (action === DISCONNECT_CSMS && status === "Accepted") {
      flowCtrl.count -= flowCtrl.count - 1 < 0 ? 0 : 1;
      ws.close();
      stations.delete(stationId);
      state.evseCount -= evseIds.length;
      const isDone = flowCtrl.count === 0 && state.evseCount === 0;
      state.status = isDone ? IDLE : STOPPING;
      state.totalCount = isDone ? 0 : state.totalCount;
      eventEmitter.emit("progress", {
        status: state.status,
        evseCount: state.evseCount,
        totalCount: state.totalCount,
      });
    }
    if (action === PLUGIN_CABLE && status === "Accepted") {
      flowCtrl.count -= flowCtrl.count - 1 < 0 ? 0 : 1;
    }
  });
};

handler.start = (payload) => {
  try {
    const { IDLE, status, eventEmitter } = state;
    if (status !== IDLE) {
      throw new Error("Invalid state to start");
    }
    eventEmitter.emit("starting", payload);
    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.starting = async (payload) => {
  try {
    const { STARTING, flowCtrl } = state;
    state.status = STARTING;

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

    const iterator = evsesByStations.entries();
    let entry = iterator.next();
    while (!entry.done && state.status === STARTING) {
      if (flowCtrl.count > flowCtrl.limit) {
        await utils.sleep(flowCtrl.waitMs);
        flowCtrl.waitMs *= 2;
        continue;
      }
      flowCtrl.waitMs = 1000;
      flowCtrl.count++;

      const [stationId, evseIds] = entry.value;
      handler.simulate(stationId, evseIds);

      entry = iterator.next();
    }
  } catch (error) {
    state.status = state.STARTED;
    console.log(error);
  }
}

handler.stop = () => {
  try {
    const { IDLE, STOPPING, status, eventEmitter } = state;
    if (status === IDLE || status === STOPPING) {
      throw new Error("Invalid state to stop");
    }
    eventEmitter.emit("stopping");
    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.stopping = async () => {
  try {
    const { STOPPING, stations, flowCtrl } = state;
    state.status = STOPPING;
    let isInit = true;

    const iterator = stations.values();
    let entry = iterator.next();
    while (!entry.done) {
      if (!isInit && flowCtrl.count > flowCtrl.limit) {
        await utils.sleep(flowCtrl.waitMs);
        flowCtrl.waitMs *= 2;
        continue;
      }
      isInit = false;
      flowCtrl.waitMs = 1000;
      flowCtrl.count++;

      const socket = entry.value;
      const action = SimulatorAction.DISCONNECT_CSMS;
      socket.sendJson({ action, payload: {} });

      entry = iterator.next();
    }
  } catch (error) {
    state.status = state.IDLE;
    console.log(error);
  }
};

export default handler;
