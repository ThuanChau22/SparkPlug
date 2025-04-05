import mongoose from "mongoose";
import ms from "ms";

import utils from "../utils/utils.js";

const Sources = {
  Central: "Central",
  Station: "Station",
}

const schema = mongoose.Schema({
  stationId: {
    type: Number,
    required: true,
    index: true,
    immutable: true,
  },
  source: {
    type: String,
    enum: Object.values(Sources),
    required: true,
  },
  event: {
    type: String,
    required: true,
  },
  payload: {
    type: Object,
    default: {},
    required: true,
  },
  expireAt: {
    type: Date,
    required: true,
    expires: 0,
  },
}, { timestamps: true });

schema.index({
  stationId: 1,
  source: 1,
});

schema.index({
  stationId: 1,
  event: 1,
});

schema.index({
  stationId: 1,
  source: 1,
  event: 1,
});

schema.loadClass(class {
  static async getEvents({ filter, sort, limit } = {}) {
    try {
      return await this.find(filter).sort(sort).limit(limit).lean();
    } catch (error) {
      console.log({ name: "StationEventGet", error });
      throw error;
    }
  }
  static async addEvent(data) {
    try {
      const { stationId, source, event, payload } = data;
      const expireAt = new Date(Date.now() + ms("1h"));
      await StationEvent.create({ stationId, source, event, payload, expireAt });
    } catch (error) {
      console.log({ name: "StationEventAdd", error });
      throw error;
    }
  }
  static async watchEvent(data = {}, options = {}) {
    try {
      const { stationId, source, event } = data;
      const filter = {
        operationType: "insert",
        $and: [],
      };
      if (stationId) {
        filter.$and.push({
          $or: utils.toArray(stationId).map((id) => {
            return { "fullDocument.stationId": id };
          })
        });
      }
      if (source) {
        filter.$and.push({
          $or: utils.toArray(source).map((src) => {
            return { "fullDocument.source": src };
          })
        });
      }
      if (event) {
        filter.$and.push({
          $or: utils.toArray(event).map((e) => {
            return { "fullDocument.event": e }
          })
        });
      }
      options = Object.entries(options).filter(([_, value]) => value);
      options = Object.fromEntries(options);
      const changeStream = await StationEvent.watch(
        [
          { $match: filter },
          { $project: { fullDocument: 1 } },
        ],
        {
          fullDocument: "updateLookup",
          ...options,
        },
      );
      changeStream.on("error", (error) => {
        console.log({ name: "WatchEvent", error });
      });
      return changeStream;
    } catch (error) {
      console.log({ name: "StationEventWatch", error });
      throw error;
    }
  }
});

const StationEvent = mongoose.model("station_event", schema);

StationEvent.Sources = Sources;

export default StationEvent;
