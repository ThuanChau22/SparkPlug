import mongoose from "mongoose";

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
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  }
});

schema.index({
  station_id: 1,
  evse_id: 1,
});

schema.loadClass(class {
  static async getStationStatuses({ filter, sort, limit } = {}) {
    try {
      return await this.find(filter).sort(sort).limit(limit).lean();
    } catch (error) {
      console.log(error);
    }
  }
  static async getStationStatusesLatest({ filter } = {}) {
    try {
      const aggregate = [];
      if (filter) {
        const $match = {};
        for (const [key, value] of Object.entries(filter)) {
          $match[key] = value;
        }
        aggregate.push({ $match });
      }
      aggregate.push({
        $group: {
          _id: {
            station_id: "$station_id",
            evse_id: "$evse_id",
          },
          id: { $last: "$_id" },
          connector_id: { $last: "$connector_id" },
          status: { $last: "$status" },
          created_at: { $last: "$created_at" },
        }
      });
      aggregate.push({
        $project: {
          _id: "$id",
          station_id: "$_id.station_id",
          evse_id: "$_id.evse_id",
          connector_id: "$connector_id",
          status: "$status",
          created_at: "$created_at",
        }
      });
      aggregate.push({
        $sort: {
          station_id: 1,
          evse_id: 1,
        }
      });
      return await StationStatus.aggregate(aggregate);
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
