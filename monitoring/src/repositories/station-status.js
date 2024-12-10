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
  station_id: {
    type: Number,
    required: true,
    index: true,
    immutable: true,
  },
  evse_id: {
    type: Number,
    required: true,
    immutable: true,
  },
  connector_id: {
    type: Number,
    required: true,
    immutable: true,
  },
  status: {
    type: String,
    enum: Object.values(Status),
    required: true,
  },
  site_id: {
    type: Number,
    required: true,
    immutable: true,
  },
  owner_id: {
    type: Number,
    required: true,
    immutable: true,
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
  station_created_at: {
    type: Date,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  }
});

schema.index({ station_id: 1, evse_id: 1 });
schema.index({ location: "2dsphere" });

schema.loadClass(class {
  static async getStationStatuses({ filter, sort, limit } = {}) {
    try {
      return await this.find(filter).sort(sort).limit(limit).lean();
    } catch (error) {
      console.log(error);
    }
  }
  static async getStationStatusesLatest({ filter, sort, limit, cursor } = {}) {
    try {
      const aggregate = [];
      let hasDistance = false;

      // Filter
      let $match = {};
      if (filter) {
        const { lat_lng_origin, lat_lng_min, lat_lng_max, ...remain } = filter;
        const [latOrigin, lngOrigin] = lat_lng_origin?.split(",") || [];
        if (latOrigin && lngOrigin) {
          aggregate.push({
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [
                  parseFloat(lngOrigin),
                  parseFloat(latOrigin),
                ],
              },
              distanceField: "distance",
              distanceMultiplier: 0.001,
              spherical: true,
            }
          });
          hasDistance = true;
        }
        const [latMin, lngMin] = lat_lng_min?.split(",") || [];
        const [latMax, lngMax] = lat_lng_max?.split(",") || [];
        if ((latMin && lngMin) || (latMax && lngMax)) {
          const lowerBound = [parseFloat(lngMin || -180), parseFloat(latMin || -90)];
          const upperBound = [parseFloat(lngMax || 180), parseFloat(latMax || 90)];
          $match.location = { $geoWithin: { $box: [lowerBound, upperBound] } };
        }
        for (const [key, value] of Object.entries(remain)) {
          $match[key] = utils.isInteger(value) ? parseInt(value) : value;
        }
      }

      const sortDefault = { station_created_at: 1, _id: 1 };
      if (sort) {
        const isDesc = /^-(.*)+$/.test(sort);
        const field = isDesc ? sort.substring(1) : sort;
        const value = isDesc ? -1 : 1;
        if (field === "id") {
          sort = { _id: value };
        } else if (field === "created_at") {
          sort = { ...sortDefault };
          sort[field] = value;
        } else {
          sort = { [field]: value, ...sortDefault };
        }
      } else {
        sort = sortDefault;
      }

      // Paging Read
      if (cursor) {
        const payload = utils.toJSON(decode(cursor).toString()) || {};
        let condition = {};
        const params = Object.keys(sort)
          .filter((field) => payload[field])
          .map((field) => [field, payload[field]]);
        for (let [field, value] of params.reverse()) {
          if (utils.isIsoDate(value)) {
            value = new Date(value);
          }
          if (utils.isObjectEmpty(condition)) {
            condition = { field: value }
          } else {
            condition = {
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
        }
        $match = { ...$match, ...condition }
      }

      aggregate.push(
        { $match },
        { // Latest
          $group: {
            _id: {
              station_id: "$station_id",
              evse_id: "$evse_id",
            },
            id: { $last: "$_id" },
            connector_id: { $last: "$connector_id" },
            status: { $last: "$status" },
            site_id: { $last: "$site_id" },
            owner_id: { $last: "$owner_id" },
            location: { $last: "$location" },
            station_created_at: { $last: "$station_created_at" },
            created_at: { $last: "$created_at" },
            ...hasDistance ? { distance: { $last: "$distance" } } : {},
          }
        },
        { // Select
          $project: {
            _id: "$id",
            station_id: "$_id.station_id",
            evse_id: "$_id.evse_id",
            connector_id: "$connector_id",
            status: "$status",
            site_id: "$site_id",
            owner_id: "$owner_id",
            latitude: { $arrayElemAt: ["$location.coordinates", 1] },
            longitude: { $arrayElemAt: ["$location.coordinates", 0] },
            station_created_at: "$station_created_at",
            created_at: "$created_at",
            distance: "$distance",
            ...hasDistance ? { distance: "$distance" } : {},
          }
        },
        { $sort: sort },
      );

      // Limit
      if (limit) {
        aggregate.push({ $limit: parseInt(limit) });
      }

      // Query
      const stationStatuses = await StationStatus.aggregate(aggregate);

      // Paging Write
      let next = "";
      if (stationStatuses.length === parseInt(limit)) {
        const lastItem = stationStatuses[stationStatuses.length - 1];
        const payload = Object.keys(sort)
          .filter((field) => lastItem[field])
          .map((field) => [field, lastItem[field]])
          .reduce((obj, [field, value]) => ({ ...obj, [field]: value }), {});
        next = encode(Buffer.from(JSON.stringify(payload)));
      }
      return {
        data: stationStatuses,
        cursor: { next },
      };
    } catch (error) {
      console.log(error);
    }
  }
  static async addStationStatus(data) {
    try {
      const model = {
        station_id: data.stationId,
        evse_id: data.evseId,
        connector_id: data.connectorId,
        status: data.status,
        site_id: data.site_id,
        owner_id: data.owner_id,
        location: {
          type: "Point",
          coordinates: [
            data.longitude,
            data.latitude,
          ],
        },
        station_created_at: data.created_at,
      };
      if (data.timestamp) {
        model.created_at = data.timestamp;
      }
      await this.create(model);
    } catch (error) {
      console.log(error);
    }
  }
});

const StationStatus = mongoose.model("station_status", schema);

StationStatus.Status = Status;

export default StationStatus;
