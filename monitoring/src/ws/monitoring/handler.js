import axios from "axios";
import WebSocket from "ws";

import { STATION_API_ENDPOINT } from "../../config.js";
import Monitoring from "../../repository/monitoring.js";
import remoteControl from "../ocpp/handlers/remote-control.js";
import { clients } from "../ocpp/server.js";
import {
  socketToChangeStream,
  socketToUser,
} from "./server.js";

export const Action = {
  REMOTE_START: "RemoteStart",
  REMOTE_STOP: "RemoteStop",
  WATCH_ALL_EVENT: "WatchAllEvent",
  WATCH_STATUS_EVENT: "WatchStatusEvent",
};

export const handleRemoteStart = async ({ ws, payload }) => {
  let response = { status: "Unavailable" };
  const { stationId, evseId } = payload;
  if (clients.get(stationId)?.station?.state === WebSocket.OPEN) {
    const { station: client } = clients.get(stationId);
    response = await remoteControl.requestStartTransactionRequest(client, { evseId });
  }
  ws.sendJson({
    action: Action.REMOTE_START,
    payload: response,
  });
};

export const handleRemoteStop = async ({ ws, payload }) => {
  let response = { status: "Unavailable" };
  const { stationId, evseId } = payload;
  if (clients.get(stationId)?.station?.state === WebSocket.OPEN) {
    const { station: client, evseIdToTransactionId } = clients.get(stationId);
    const transactionId = evseIdToTransactionId.get(evseId);
    response = await remoteControl.requestStopTransactionRequest(client, { transactionId });
  }
  ws.sendJson({
    action: Action.REMOTE_STOP,
    payload: response,
  });
};

export const handleWatchAllEvent = async ({ ws, payload }) => {
  try {
    const { stationId } = payload;
    const { token } = socketToUser.get(ws);
    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await axios.get(`${STATION_API_ENDPOINT}/${stationId}`, { headers });
    if (!data) {
      throw { code: 403, message: `Access denied` };
    }
    socketToChangeStream.get(ws)?.close();
    const changeStream = await Monitoring.watchAllEvent({ stationId });
    changeStream.on("change", ({ fullDocument }) => {
      const { stationId, event, payload, createdAt } = fullDocument;
      ws.sendJson({
        action: Action.WATCH_ALL_EVENT,
        payload: { stationId, event, payload, createdAt },
      });
    });
    socketToChangeStream.set(ws, changeStream);
    ws.sendJson({
      action: Action.WATCH_ALL_EVENT,
      payload: { status: "Accepted" },
    });
  } catch (error) {
    if (error.response) {
      const { status: code } = error.response;
      const { message } = error.response.data;
      console.log(error.response);
      return ws.sendJson({
        action: Action.WATCH_ALL_EVENT,
        payload: {
          status: "Rejected",
          statusInfo: { code, message }
        },
      });
    }
    if (error.code === 403) {
      const { code, message } = error;
      return ws.sendJson({
        action: Action.WATCH_STATUS_EVENT,
        payload: {
          status: "Rejected",
          statusInfo: { code, message }
        },
      });
    }
    console.log(error);
  }
};

export const handleWatchStatusEvent = async ({ ws, payload }) => {
  try {
    const { stationIdList } = payload;
    const { token } = socketToUser.get(ws);
    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await axios.get(`${STATION_API_ENDPOINT}`, { headers });
    const reducer = (o, id) => ({ ...o, [id]: id });
    const ownedStationIdList = data.map(({ id }) => id).reduce(reducer, {});
    for (const stationId of stationIdList) {
      if (!ownedStationIdList[stationId]) {
        throw { code: 403, message: `Access denied on station ${stationId}` };
      }
    }
    socketToChangeStream.get(ws)?.close();
    const changeStream = await Monitoring.watchStatusEvent({ stationIdList });
    changeStream.on("change", ({ fullDocument }) => {
      const { stationId, event, payload, createdAt } = fullDocument;
      ws.sendJson({
        action: Action.WATCH_STATUS_EVENT,
        payload: { stationId, event, payload, createdAt },
      });
    });
    socketToChangeStream.set(ws, changeStream);
    ws.sendJson({
      action: Action.WATCH_STATUS_EVENT,
      payload: { status: "Accepted" },
    });
  } catch (error) {
    if (error.response) {
      const { status: code } = error.response;
      const { message } = error.response.data;
      return ws.sendJson({
        action: Action.WATCH_STATUS_EVENT,
        payload: {
          status: "Rejected",
          statusInfo: { code, message }
        },
      });
    }
    if (error.code === 403) {
      const { code, message } = error;
      return ws.sendJson({
        action: Action.WATCH_STATUS_EVENT,
        payload: {
          status: "Rejected",
          statusInfo: { code, message }
        },
      });
    }
    console.log(error);
  }
};
