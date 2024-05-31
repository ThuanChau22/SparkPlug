import axios from "axios";

import { STATION_API_ENDPOINT } from "../../config.js";
import Monitoring from "../../repository/monitoring.js";
import utils from "../../utils/utils.js";
import { sockets } from "./server.js";

export const Action = {
  REMOTE_START: "RemoteStart",
  REMOTE_STOP: "RemoteStop",
  WATCH_ALL_EVENT: "WatchAllEvent",
  WATCH_STATUS_EVENT: "WatchStatusEvent",
};

const handler = {};

handler.remoteStart = async (payload) => {
  try {
    const { stationId, evseId } = payload;
    await Monitoring.addEvent({
      stationId,
      source: Monitoring.Sources.Central,
      event: "RequestStartTransaction",
      payload: { evseId },
    });
    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.remoteStop = async (payload) => {
  try {
    const { stationId, evseId } = payload;
    await Monitoring.addEvent({
      stationId,
      source: Monitoring.Sources.Central,
      event: "RequestStopTransaction",
      payload: { evseId },
    });
    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    const message = error.message;
    return { status, message };
  }
};

handler.watchAllEvent = async (ws, payload, response) => {
  try {
    const { stationId } = payload;
    const instance = sockets.get(ws);
    const { user: { token } } = instance;
    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await axios.get(`${STATION_API_ENDPOINT}/${stationId}`, { headers });
    if (!data) {
      throw { code: 403, message: "Access denied" };
    }
    instance?.changeStream?.close();
    instance.changeStream = await Monitoring.watchEvent({
      stationId,
      source: Monitoring.Sources.Station,
    });
    instance.changeStream.on("change", ({ fullDocument }) => {
      fullDocument = utils.toClient(fullDocument);
      const { id, stationId, event, payload, createdAt } = fullDocument;
      response({ id, stationId, event, payload, createdAt });
    });
    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    if (error.response) {
      const message = error.response.data;
      return { status, message };
    }
    if (error.code === 403) {
      const { message } = error;
      return { status, message };
    }
    console.log(error);
  }
};

handler.watchStatusEvent = async (ws, payload, response) => {
  try {
    const { stationIds } = payload;
    const instance = sockets.get(ws);
    const { user: { token } } = instance;
    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await axios.get(`${STATION_API_ENDPOINT}`, { headers });
    const reducer = (o, id) => ({ ...o, [id]: id });
    const ownedStationIdList = data.map(({ id }) => id).reduce(reducer, {});
    for (const stationId of stationIds) {
      if (!ownedStationIdList[stationId]) {
        throw { code: 403, message: `Access denied on station ${stationId}` };
      }
    }
    instance?.changeStream?.close();
    instance.changeStream = await Monitoring.watchEvent({
      stationId: stationIds,
      event: "StatusNotification",
    });
    instance.changeStream.on("change", ({ fullDocument }) => {
      fullDocument = utils.toClient(fullDocument);
      const { id, stationId, event, payload, createdAt } = fullDocument;
      response({ id, stationId, event, payload, createdAt });
    });
    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    if (error.response) {
      const message = error.response.data;
      return { status, message };
    }
    if (error.code === 403) {
      const { message } = error;
      return { status, message };
    }
    console.log(error);
  }
}

export default handler;
