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
    const watchAllEvent = async () => {
      const Event = Action.WATCH_ALL_EVENT;
      changeStream[Event]?.close();
      changeStream[Event] = await StationEvent.watchEvent(
        {
          stationId,
          source: StationEvent.Sources.Station,
        },
        { resumeAfter },
      );
      changeStream[Event].on("change", ({ _id, fullDocument }) => {
        resumeAfter = _id;
        fullDocument = utils.toClient(fullDocument);
        const { id, stationId, event, payload, createdAt } = fullDocument;
        response({ id, stationId, event, payload, createdAt });
      });
      changeStream[Event].on("error", (error) => {
        console.log({ name: "WatchAllEvent", error });
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
    const { changeStream } = sockets.get(ws);

    let resumeAfter;
    const watchStatusEvent = async () => {
      const Event = Action.WATCH_STATUS_EVENT;
      changeStream[Event]?.close();
      changeStream[Event] = await StationEvent.watchEvent(
        {
          stationId: stationIds,
          event: "StatusNotification",
        },
        { resumeAfter },
      );
      changeStream[Event].on("change", ({ _id, fullDocument }) => {
        resumeAfter = _id;
        fullDocument = utils.toClient(fullDocument);
        const { id, stationId, event, payload, createdAt } = fullDocument;
        response({ id, stationId, event, payload, createdAt });
      });
      changeStream[Event].on("error", (error) => {
        console.log({ name: "WatchStatusEvent", error });
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
    if (error.code === 403) {
      const { message } = error;
      return { status, message };
    }
    console.log(error);
  }
}

export default handler;
