import mongoose from "mongoose";
import { encode, decode } from "safe-base64";

import utils from "../utils/utils.js";

const Status = {
  Available: "Available",
  Occupied: "Occupied",
  Reserved: "Reserved",
  Unavailable: "Unavailable",
  Faulted: "Faulted",
}

const schema = mongoose.Schema({
  stationId: {
    type: Number,
    required: true,
    index: true,
    immutable: true,
  },
  evseId: {
    type: Number,
    required: true,
  },
  connectorId: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(Status),
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
}, { timestamps: true });

schema.index({ stationId: 1, evseId: 1 });
schema.index({
  stationId: 1,
  evseId: 1,
  connectorId: 1,
}, { unique: true });
schema.index({ location: "2dsphere" });

schema.loadClass(class {
  static async getStatuses({ filter, sort, limit, cursor } = {}) {
    try {
      const pipeline = [];

      // Select
      const $project = {
        id: "$_id",
        stationId: "$stationId",
        evseId: "$evseId",
        connectorId: "$connectorId",
        status: "$status",
        latitude: { $arrayElemAt: ["$location.coordinates", 1] },
        longitude: { $arrayElemAt: ["$location.coordinates", 0] },
        createdAt: "$createdAt",
      };

      // Filter
      const $match = {};
      if (filter) {
        const { lat_lng_origin, lat_lng_min, lat_lng_max, ...remain } = filter;

        // Distance
        const [latOrigin, lngOrigin] = lat_lng_origin?.split(",") || [];
        if (latOrigin && lngOrigin) {
          const coordinates = [parseFloat(lngOrigin), parseFloat(latOrigin)];
          pipeline.push({
            $geoNear: {
              near: { type: "Point", coordinates },
              distanceField: "distance",
              distanceMultiplier: 0.001,
              spherical: true,
            }
          });
          $project.distance = "$distance";
        }

        // Location
        const [latMin, lngMin] = lat_lng_min?.split(",") || [];
        const [latMax, lngMax] = lat_lng_max?.split(",") || [];
        if ((latMin && lngMin) || (latMax && lngMax)) {
          const lowerBound = [parseFloat(lngMin || -180), parseFloat(latMin || -90)];
          const upperBound = [parseFloat(lngMax || 180), parseFloat(latMax || 90)];
          $match.location = { $geoWithin: { $box: [lowerBound, upperBound] } };
        }

        // Remaining Field
        for (const [field, value] of Object.entries(remain)) {
          const key = utils.snakeToCamel(field);
          $match[key] = utils.isInteger(value) ? parseInt(value) : value;
        }
      }

      // Sort
      const $sort = {};
      if (sort) {
        for (const field of sort.split(",")) {
          const isDesc = /^-(.*)+$/.test(field);
          const key = isDesc ? field.substring(1) : field;
          $sort[utils.snakeToCamel(key)] = isDesc ? -1 : 1;
        }
        const hasId = "stationId" in $sort;
        const hasCreatedAt = "createdAt" in $sort;
        if (!hasId && !hasCreatedAt) {
          $sort["createdAt"] = 1;
        }
        if (!hasId) {
          $sort["stationId"] = 1;
        }
      } else {
        Object.assign($sort, { createdAt: 1, stationId: 1 });
      }

      // Paging Read
      if (cursor) {
        let condition = {};
        const payload = utils.toJSON(decode(cursor).toString()) || {};
        const params = Object.keys($sort)
          .filter((field) => payload[field])
          .map((field) => [field, payload[field]]);
        for (let [field, value] of params.reverse()) {
          value = utils.isIsoDate(value) ? new Date(value) : value;
          condition = utils.isObjectEmpty(condition)
            ? { field: value }
            : {
              $or: [
                { [field]: { $gt: value } },
                {
                  $and: [
                    { [field]: { $eq: value } },
                    { ...condition },
                  ],
                }
              ],
            };
        }
        Object.assign($match, condition);
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
        const payload = Object.keys($sort)
          .filter((field) => lastItem[field])
          .map((field) => [field, lastItem[field]])
          .reduce((obj, [field, value]) => ({ ...obj, [field]: value }), {});
        next = encode(Buffer.from(JSON.stringify(payload)));
      }

      return { data, cursor: { next } };
    } catch (error) {
      console.log({ name: "StationStatusGet", error });
      throw error;
    }
  }

  static async getStatusCount() {
    try {
      const pipeline = [
        {
          $group: {
            _id: "$status",
            count: { $count: {} },
          }
        },
        {
          $project: {
            _id: 0,
            status: "$_id",
            count: "$count",
          },
        },
      ];
      return await this.aggregate(pipeline);
    } catch (error) {
      console.log({ name: "StationStatusCount", error });
      throw error
    }
  }

  static async upsertStatus(data) {
    try {
      const { stationId, evseId, connectorId } = data;
      const filter = { stationId, evseId, connectorId };

      const { longitude, latitude, ...remain } = data;
      const coordinates = [longitude, latitude];
      const location = { type: "Point", coordinates };
      const update = { ...remain, location };

      const options = { upsert: true, new: true, lean: true };
      options.timestamps = {
        createdAt: !remain.createdAt,
        updatedAt: !remain.updatedAt,
      };
      return await this.findOneAndUpdate(filter, update, options);
    } catch (error) {
      console.log({ name: "StationStatusUpsert", error });
      throw error;
    }
  }
});

const StationStatus = mongoose.model("station_status", schema);

StationStatus.Status = Status;

export default StationStatus;
