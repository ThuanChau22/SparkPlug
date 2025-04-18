import mongoose from "mongoose";

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
  rdbId: {
    type: Number,
    required: true,
    index: true,
  },
  siteId: {
    type: Number,
    required: true,
    index: true,
  },
  ownerId: {
    type: Number,
    required: true,
    index: true,
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
        _id: 0,
        id: "$_id",
        stationId: "$stationId",
        evseId: "$evseId",
        connectorId: "$connectorId",
        status: "$status",
        rdbId: "$rdbId",
        latitude: { $arrayElemAt: ["$location.coordinates", 1] },
        longitude: { $arrayElemAt: ["$location.coordinates", 0] },
        createdAt: "$createdAt",
      };

      // Filter
      const $match = {};
      if (filter) {
        // Distance
        const { latLngOrigin, latLngMin, latLngMax, ...remain } = filter;
        const [latOrigin, lngOrigin] = latLngOrigin?.split(",") || [];
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
        const [latMin, lngMin] = latLngMin?.split(",") || [];
        const [latMax, lngMax] = latLngMax?.split(",") || [];
        if ((latMin && lngMin) || (latMax && lngMax)) {
          const lowerBound = [parseFloat(lngMin || -180), parseFloat(latMin || -90)];
          const upperBound = [parseFloat(lngMax || 180), parseFloat(latMax || 90)];
          $match.location = { $geoWithin: { $box: [lowerBound, upperBound] } };
        }

        // Remaining
        for (const [field, value] of Object.entries(remain)) {
          $match[field] = value;
          $project[field] = `$${field}`;
        }
      }

      // Sort
      const $sort = {};
      if (sort) {
        for (const [field, value] of Object.entries(sort)) {
          $sort[field] = value;
        }
        const hasRdbId = "rdbId" in $sort;
        const hasCreatedAt = "createdAt" in $sort;
        if (!hasRdbId && !hasCreatedAt) {
          $sort["createdAt"] = 1;
        }
        if (!hasRdbId) {
          $sort["rdbId"] = 1;
        }
      } else {
        Object.assign($sort, { createdAt: 1, rdbId: 1 });
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
      console.log({ name: "StationStatusGet", error });
      throw error;
    }
  }

  static async getStatusCount({ filter } = {}) {
    try {
      const $match = {};
      for (const [field, value] of Object.entries(filter || {})) {
        $match[field] = value;
      }
      const pipeline = [
        { $match },
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
        { $sort: { status: 1 } },
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
