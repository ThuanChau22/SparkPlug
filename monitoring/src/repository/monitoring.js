import mongoose from "mongoose";
import ms from "ms";

const schema = mongoose.Schema({
  stationId: {
    type: String,
    required: true,
    index: true,
    immutable: true,
  },
  event: {
    type: String,
    required: true,
    index: true,
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
  event: 1
});

schema.index({
  "event": 1,
  "payload.eventType": 1,
  "payload.transactionInfo.transactionId": 1,
}, { sparse: true });

schema.loadClass(class {
  static async getEventByStationId(stationId) {
    try {
      return await this.find({ stationId }).sort({ createdAt: 1 }).lean();
    } catch (error) {
      console.log(error);
    }
  }
  static async add(data) {
    try {
      const { stationId, event, payload } = data;
      const expireAt = new Date(Date.now() + ms("1h"));
      await Monitoring.create({ stationId, event, payload, expireAt });
    } catch (error) {
      console.log(error);
    }
  }
  static async watchStatusEvent(data) {
    try {
      const { stationIdList } = data;
      return await Monitoring.watch(
        [
          {
            $match: {
              "operationType": "insert",
              "fullDocument.event": "StatusNotification",
              $or: stationIdList.map((id) => ({ "fullDocument.stationId": id }))
            }
          },
          { $project: { fullDocument: 1 } },
        ],
        { fullDocument: "updateLookup" },
      );
    } catch (error) {
      console.log(error);
    }
  }
  static async watchAllEvent(data) {
    try {
      const { stationId } = data;
      return await Monitoring.watch(
        [
          {
            $match: {
              "operationType": "insert",
              "fullDocument.stationId": stationId,
            }
          },
          { $project: { fullDocument: 1 } },
        ],
        { fullDocument: "updateLookup" },
      );
    } catch (error) {
      console.log(error);
    }
  }
});

export const Monitoring = mongoose.model("monitoring", schema);
