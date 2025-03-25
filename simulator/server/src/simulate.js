import axios from "axios";
import { EventEmitter } from "events";
import ms from "ms";
import WebSocket from "ws";

import { PORT, STATION_API_ENDPOINT } from "./config.js";
import { Action } from "./ws/simulator/handler.js";

const sleep = (delay) => new Promise((res) => setTimeout(res, delay));

const connectStation = (stationId) => {
  const event = new EventEmitter();
  const socket = new WebSocket(`ws://localhost:${PORT}/ws/simulator/${stationId}`);
  socket.sendJson = (payload) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  };
  socket.onMessage = (listener) => {
    event.on("message", listener);
  };
  socket.on("message", (data) => {
    try {
      if (data.toString() === "ping") {
        return socket.send("pong");
      }
      let message = {};
      try {
        message = JSON.parse(data);
      } catch (error) {
        const status = "Rejected";
        const message = "Invalid message";
        return socket.sendJson({ payload: { status, message } });
      }
      event.emit("message", message);
    } catch (error) {
      const status = "Rejected";
      const message = "An unknown error occurred";
      socket.sendJson({ payload: { status, message } });
      console.log(error);
    }
  });
  return socket;
};

const randomAvailability = () => {
  const value = Math.random();
  return value < 0.80 ? "Available" : "Occupied";
};

const simulate = async () => {
  try {
    const stations = new Map();
    const endpoint = `${STATION_API_ENDPOINT}/evses`;
    const params = "fields=station_id,evse_id&limit=250";
    const { data: { evses } } = await axios.get(`${endpoint}?${params}`);
    const flowCtrl = { count: 0, waitMs: 1000 };
    while (evses.length !== 0) {
      if (flowCtrl.count <= 50) {
        const { station_id, evse_id } = evses.shift();
        if (!stations.has(station_id)) {
          flowCtrl.count++;
          const socket = connectStation(station_id);
          socket.onMessage(({ action, payload }) => {
            const isAccepted = payload.status === "Accepted";
            if (action === Action.CONNECT_SIM && isAccepted) {
              socket.sendJson({
                action: Action.CONNECT_CSMS,
                payload: {},
              });
            }
            if (action === Action.CONNECT_CSMS && isAccepted) {
              if (randomAvailability() === "Occupied") {
                socket.sendJson({
                  action: Action.PLUGIN_CABLE,
                  payload: { evseId: evse_id, connectorId: 1 },
                });
              } else {
                flowCtrl.count--;
              }
            }
            if (action === Action.PLUGIN_CABLE && isAccepted) {
              flowCtrl.count--;
            }
          });
          stations.set(station_id, socket);
        }
        flowCtrl.waitMs = 1000;
      } else {
        console.log({ remain: evses.length, waitTime: ms(flowCtrl.waitMs) });
        await sleep(flowCtrl.waitMs);
        flowCtrl.waitMs *= 2;
      }
    }
    console.log({ remain: evses.length }, "DONE");
  } catch (error) {
    console.log(error);
  }
};
simulate();
