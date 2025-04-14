import axios from "axios";

import { STATION_API_ENDPOINT } from "../../config.js";
import StationEvent from "../../repositories/station-event.js";
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

handler.watchAllEvent = async (ws, payload, response) => {
  try {
    const { stationId } = payload;
    const { user: { token }, changeStream } = sockets.get(ws);

    const headers = { Authorization: `Bearer ${token}` };
    await axios.get(`${STATION_API_ENDPOINT}/${stationId}`, { headers });

    let resumeAfter;
    let requestAttempts = 0;
    const watchAllEvent = async () => {
      const Event = Action.WATCH_ALL_EVENT;
      changeStream[Event]?.close();
      changeStream[Event] = await StationEvent.watchEvent({
        stationId,
        // source: StationEvent.Sources.Station,
      }, { resumeAfter });
      changeStream[Event].on("change", ({ _id, fullDocument }) => {
        resumeAfter = _id;
        const { id, stationId, event, payload, createdAt } = fullDocument;
        response({ id, stationId, event, payload, createdAt });
        requestAttempts = 0;
      });
      changeStream[Event].on("error", (error) => {
        console.log({ name: "WatchAllEventChange", error });
        if (requestAttempts > 3) {
          throw error;
        }
        requestAttempts++;
        watchAllEvent();
      });
    };
    await watchAllEvent();

    return { status: "Accepted" };
  } catch (error) {
    const status = "Rejected";
    if (error.response) {
      const message = error.response.data;
      return { status, message };
    }
    console.log({ name: "WatchStatusEventRequest", error });
  }
};

handler.watchStatusEvent = async (ws, payload, response) => {
  try {
    const { stationId } = payload;
    if (stationId && utils.toArray(stationId).length === 0) {
      const message = "stationId list cannot be empty";
      throw { code: 400, message };
    }
    const { changeStream } = sockets.get(ws);

    let resumeAfter;
    let requestAttempts = 0;
    const watchStatusEvent = async () => {
      const Event = Action.WATCH_STATUS_EVENT;
      changeStream[Event]?.close();
      changeStream[Event] = await StationEvent.watchEvent({
        stationId,
        event: "StatusNotification",
      }, { resumeAfter });
      changeStream[Event].on("change", ({ _id, fullDocument }) => {
        resumeAfter = _id;
        const { id, stationId, event, payload, createdAt } = fullDocument;
        response({ id, stationId, event, payload, createdAt });
        requestAttempts = 0;
      });
      changeStream[Event].on("error", (error) => {
        console.log({ name: "WatchStatusEventChange", error });
        if (requestAttempts > 3) {
          throw error;
        }
        requestAttempts++;
        watchStatusEvent();
      });
    };
    await watchStatusEvent();

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
    console.log({ name: "WatchStatusEventRequest", error });
  }
}

export default handler;
