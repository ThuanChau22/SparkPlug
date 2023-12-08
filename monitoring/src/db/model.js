import mongoose from "mongoose";
import ms from "ms";

import { handleMonitoring } from "../ws/message.js";

const monitoringSchema = mongoose.Schema({
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
    type: mongoose.Schema({
      eventType: {
        type: String,
      },
      transactionInfo: {
        transactionId: {
          type: String,
        },
      },
    }, { _id: false }),
    default: {},
    required: true,
  },
  expireAt: {
    type: Date,
    required: true,
    expires: 0,
  },
}, { timestamps: true });

monitoringSchema.index({
  stationId: 1,
  event: 1
});

monitoringSchema.index({
  "event": 1,
  "payload.eventType": 1,
  "payload.transactionInfo.transactionId": 1,
}, { sparse: true });

monitoringSchema.loadClass(class {
  static async add(data) {
    try {
      const { stationId, event, payload } = data;
      const expireAt = new Date(Date.now() + ms("1h"));
      await Monitoring.create({ stationId, event, payload, expireAt });
    } catch (error) {
      console.log(error);
    }
  }
});

export const Monitoring = mongoose.model("monitoring", monitoringSchema);

const changeStream = Monitoring.watch(
  [
    { $match: { operationType: "insert" } },
    { $project: { fullDocument: 1 } },
  ],
  { fullDocument: "updateLookup" },
);
changeStream.on("change", async ({ fullDocument }) => {
  const { stationId, event, payload } = fullDocument;
  handleMonitoring({ stationId, event, content: payload });
});
