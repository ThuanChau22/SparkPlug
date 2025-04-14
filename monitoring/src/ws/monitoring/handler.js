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
    if (payload.type !== "Start" && payload.type !== "Stop") {
      const message = `Unrecognized payload.type: ${payload.type}`;
      throw { code: 400, message };
    }

    const { user: { token }, changeStream } = sockets.get(ws);

    if (payload.type === "Start") {
      const stationId = payload?.data?.stationId;
      if (!stationId) {
        const message = "Field 'payload.stationId' is required";
        throw { code: 400, message };
      }

      const headers = { Authorization: `Bearer ${token}` };
      await axios.get(`${STATION_API_ENDPOINT}/${stationId}`, { headers });

      let resumeAfter;
      let requestAttempts = 0;
      const watchAllEvent = async () => {
        let cursor = changeStream[Action.WATCH_ALL_EVENT];
        cursor?.close();
        cursor = await StationEvent.watchEvent({
          stationId,
          source: StationEvent.Sources.Station,
        }, { resumeAfter });
        cursor.on("change", ({ _id, fullDocument }) => {
          resumeAfter = _id;
          const { id, stationId, event, payload, createdAt } = fullDocument;
          const data = { id, stationId, event, payload, createdAt };
          response({ type: "Update", data });
          requestAttempts = 0;
        });
        cursor.on("error", (error) => {
          console.log({ name: "WatchAllEventChange", error });
          if (requestAttempts > 3) {
            throw error;
          }
          requestAttempts++;
          watchAllEvent();
        });
        changeStream[Action.WATCH_ALL_EVENT] = cursor;
      };
      await watchAllEvent();
    }

    if (payload.type === "Stop") {
      changeStream[Action.WATCH_ALL_EVENT]?.close();
      delete changeStream[Action.WATCH_ALL_EVENT];
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

handler.watchStatusEvent = async (ws, payload, response) => {
  try {
    if (payload.type !== "Start" && payload.type !== "Stop") {
      const message = `Unrecognized payload.type: ${payload.type}`;
      throw { code: 400, message };
    }

    const { changeStream } = sockets.get(ws);

    if (payload.type === "Start") {
      const stationId = payload?.data?.stationId;
      if (stationId && utils.toArray(stationId).length === 0) {
        const message = "Field 'payload.stationId' cannot be an empty list";
        throw { code: 400, message };
      }

      let resumeAfter;
      let requestAttempts = 0;
      const watchStatusEvent = async () => {
        let cursor = changeStream[Action.WATCH_STATUS_EVENT];
        cursor?.close();
        cursor = await StationEvent.watchEvent({
          stationId,
          event: "StatusNotification",
        }, { resumeAfter });
        cursor.on("change", ({ _id, fullDocument }) => {
          resumeAfter = _id;
          const { id, stationId, event, payload, createdAt } = fullDocument;
          const data = { id, stationId, event, payload, createdAt };
          response({ type: "Update", data });
          requestAttempts = 0;
        });
        cursor.on("error", (error) => {
          console.log({ name: "WatchStatusEventChange", error });
          if (requestAttempts > 3) {
            throw error;
          }
          requestAttempts++;
          watchStatusEvent();
        });
        changeStream[Action.WATCH_STATUS_EVENT] = cursor;
      };
      await watchStatusEvent();
    }

    if (payload.type === "Stop") {
      changeStream[Action.WATCH_STATUS_EVENT]?.close();
      delete changeStream[Action.WATCH_STATUS_EVENT];
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
    console.log({ name: "WatchStatusEventRequest", error });
  }
}

export default handler;
