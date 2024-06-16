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

// Indexing TransactionEvent Request for all stations
// schema.index({
//   event: 1,
//   "payload.eventType": 1,
// }, { sparse: true });

schema.loadClass(class {
  static async getEvents({ filter, sort, limit } = {}) {
    try {
      return await this.find(filter).sort(sort).limit(limit).lean();
    } catch (error) {
      console.log(error);
    }
  }
  static async addEvent(data) {
    try {
      const { stationId, source, event, payload } = data;
      const expireAt = new Date(Date.now() + ms("1h"));
      await StationEvent.create({ stationId, source, event, payload, expireAt });
    } catch (error) {
      console.log(error);
    }
  }
  static async watchEvent(data = {}) {
    try {
      const { stationId, source, event } = data;
      const filters = {
        operationType: "insert",
        $and: [],
      };
      if (stationId) {
        filters.$and.push({
          $or: utils.toArray(stationId).map((id) => {
            return { "fullDocument.stationId": id };
          })
        });
      }
      if (source) {
        filters.$and.push({
          $or: utils.toArray(source).map((src) => {
            return { "fullDocument.source": src };
          })
        });
      }
      if (event) {
        filters.$and.push({
          $or: utils.toArray(event).map((e) => {
            return { "fullDocument.event": e }
          })
        });
      }
      return await StationEvent.watch(
        [
          { $match: filters },
          { $project: { fullDocument: 1 } },
        ],
        { fullDocument: "updateLookup" },
      );
    } catch (error) {
      console.log(error);
    }
  }
});

const StationEvent = mongoose.model("station_event", schema);

StationEvent.Sources = Sources;

export default StationEvent;
