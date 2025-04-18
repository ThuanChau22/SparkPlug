import axios from "axios";

import {
  AUTH_API_ENDPOINT,
  STATION_API_ENDPOINT,
} from "../../config.js";
import StationEvent from "../../repositories/station-event.js";
import utils from "../../utils/utils.js";
import server from "./server.js";

export const Action = {
  CONNECT: "Connect",
  REMOTE_START: "RemoteStart",
  REMOTE_STOP: "RemoteStop",
  WATCH_ALL_EVENT: "WatchAllEvent",
  WATCH_STATUS_EVENT: "WatchStatusEvent",
};

const handler = {};

handler.connect = async (payload) => {
  try {
    const { socket } = payload;
    if (socket.session.authenticating) {
      return { status: "Pending" };
    }
    if (!socket.session.authenticated) {
      socket.session.authenticating = true;
      const endpoint = `${AUTH_API_ENDPOINT}/verify`;
      const body = { token: socket.session.token };
      const { data } = await axios.post(endpoint, body);
      Object.assign(socket.session, data);
      socket.session.authenticated = true;
      socket.session.authenticating = false;
    }
    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    if (error.response?.status === 401) {
      error.message = error.response.data.message;
    }
    const message = error.message;
    return { status, message };
  }
};

handler.remoteStart = async (payload) => {
  try {
    const { stationId, evseId } = payload;
    await StationEvent.addEvent({
      stationId,
      source: StationEvent.Sources.Central,
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
    await StationEvent.addEvent({
      stationId,
      source: StationEvent.Sources.Central,
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

handler.watchAllEvent = async (payload, response) => {
  try {
    const { socket, type, data } = payload;
    if (type !== "Start" && type !== "Stop") {
      const message = `Unrecognized payload.type: ${type}`;
      throw { code: 400, message };
    }
    const eventName = Action.WATCH_ALL_EVENT;
    if (type === "Start") {
      const stationId = data?.stationId;
      if (!stationId) {
        const message = "Field payload.data.stationId is required";
        throw { code: 400, message };
      }
      const headers = { Authorization: `Bearer ${socket.session.token}` };
      await axios.get(`${STATION_API_ENDPOINT}/${stationId}`, { headers });
      await server.stream.addEvent(socket, eventName, (data) => {
        const isStationId = data.stationId === stationId;
        const fromStation = data.source === StationEvent.Sources.Station;
        if (isStationId && fromStation) {
          response({ type: "Update", data });
        }
      });
    }
    if (type === "Stop") {
      await server.stream.removeEvent(socket, eventName);
    }
    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    if (error.response) {
      const message = error.response.data;
      return { status, message };
    }
    if (error.code) {
      const message = error.message;
      return { status, message };
    }
    console.log({ name: "WatchAllEventRequest", error });
  }
};

handler.watchStatusEvent = async (payload, response) => {
  try {
    const { socket, type, data } = payload;
    if (type !== "Start" && type !== "Stop") {
      const message = `Unrecognized payload.type: ${type}`;
      throw { code: 400, message };
    }
    const eventName = Action.WATCH_STATUS_EVENT;
    if (type === "Start") {
      const stationIdSet = new Set(utils.toArray(data?.stationId));
      if (data?.stationId && stationIdSet.size === 0) {
        const message = "StationId cannot be an empty list";
        throw { code: 400, message };
      }
      await server.stream.addEvent(socket, eventName, (data) => {
        const isSetEmpty = stationIdSet.size === 0;
        const hasStationId = stationIdSet.has(data.stationId);
        const isStatusNotification = data.event === "StatusNotification";
        if ((isSetEmpty || hasStationId) && isStatusNotification) {
          response({ type: "Update", data });
        }
      });
    }
    if (type === "Stop") {
      await server.stream.removeEvent(socket, eventName);
    }
    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    if (error.code) {
      const message = error.message;
      return { status, message };
    }
    console.log({ name: "WatchStatusEventRequest", error });
  }
}

export default handler;
