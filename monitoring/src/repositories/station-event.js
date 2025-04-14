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
  static async getEvents({ filter, sort, limit, cursor } = {}) {
    try {
      const pipeline = [];

      // Select
      const $project = {
        _id: 0,
        id: "$_id",
        stationId: "$stationId",
        source: "$source",
        event: "$event",
        payload: "$payload",
        createdAt: "$createdAt",
      };

      // Filter
      const $match = {};
      for (const [field, value] of Object.entries(filter || {})) {
        $match[field] = value;
      }

      // Sort
      const $sort = {};
      if (sort) {
        for (const [field, value] of Object.entries(sort)) {
          $sort[field] = value;
        }
        const hasId = "id" in $sort;
        const hasCreatedAt = "createdAt" in $sort;
        if (!hasId && !hasCreatedAt) {
          $sort["createdAt"] = 1;
        }
        if (!hasId) {
          $sort["id"] = 1;
        }
      } else {
        Object.assign($sort, { createdAt: 1, id: 1 });
      }

      // Paging Read
      if (cursor) {
        Object.assign($match, utils.extractCursor(cursor, $sort));
      }

      pipeline.push(
        { $match },
        { $project },
        { $sort },
      );

      // Limit
      if (limit) {
        pipeline.push({ $limit: limit });
      }

      // Query
      const data = await this.aggregate(pipeline);

      // Paging Write
      let next = "";
      if (data.length === limit) {
        const lastItem = data[data.length - 1];
        next = utils.createCursor(lastItem, $sort);
      }

      return { data, cursor: { next } };
    } catch (error) {
      console.log({ name: "StationEventGet", error });
      throw error;
    }
  }

  static async addEvent(data) {
    try {
      const { stationId, source, event, payload } = data;
      const expireAt = new Date(Date.now() + ms("1h"));
      const params = { stationId, source, event, payload, expireAt };
      await StationEvent.create(params);
    } catch (error) {
      console.log({ name: "StationEventAdd", error });
      throw error;
    }
  }

  static async watchEvent(data = {}, options = {}) {
    try {
      const { stationId, source, event } = data;
      const $match = {
        operationType: "insert",
        $and: [],
      };
      if (stationId) {
        $match.$and.push({
          $or: utils.toArray(stationId).map((id) => {
            return { "fullDocument.stationId": id };
          })
        });
      }
      if (source) {
        $match.$and.push({
          $or: utils.toArray(source).map((src) => {
            return { "fullDocument.source": src };
          })
        });
      }
      if (event) {
        $match.$and.push({
          $or: utils.toArray(event).map((e) => {
            return { "fullDocument.event": e }
          })
        });
      }

      const $project = {
        "fullDocument.id": "$fullDocument._id",
        "fullDocument.stationId": "$fullDocument.stationId",
        "fullDocument.source": "$fullDocument.source",
        "fullDocument.event": "$fullDocument.event",
        "fullDocument.payload": "$fullDocument.payload",
        "fullDocument.createdAt": "$fullDocument.createdAt",
      };

      const pipeline = [{ $match }, { $project }];

      options = Object.entries(options).filter(([_, v]) => v);
      options = Object.fromEntries(options);
      options = { fullDocument: "updateLookup", ...options };

      const changeStream = await StationEvent.watch(pipeline, options);
      changeStream.on("error", (error) => {
        console.log({ name: "WatchEventChange", error });
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
