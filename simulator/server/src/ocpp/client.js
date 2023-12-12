import ms from "ms";
import { RPCClient } from "ocpp-rpc";
import { v4 as uuid } from "uuid";

import station from "../station.js";
import { Action } from "../ws/message.js";
import { sendJsonMessage } from "../ws/server.js";
import { STATION_MANAGEMENT_WS_ENDPOINT } from "../config.js";

const ocppClient = new RPCClient({
  endpoint: STATION_MANAGEMENT_WS_ENDPOINT,
  identity: station.SecurityCtrlr.Identity,
  password: station.SecurityCtrlr.BasicAuthPassword,
  protocols: ["ocpp2.0.1"],
  strictMode: true,
});

let heartbeatTimeoutId = 0;
const setHeartbeatTimeout = () => {
  clearTimeout(heartbeatTimeoutId);
  heartbeatTimeoutId = setTimeout(async () => {
    const heartbeatResponse = await ocppClient.call("Heartbeat", {});
    console.log("Server time:", heartbeatResponse.currentTime);
    setHeartbeatTimeout();
  }, ms(`${station.OCPPCommCtrlr.HeartbeatInterval}s`));
};

const generateMeterValue = () => {
  const min = 3200;
  const max = 3600;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const ocppClientCall = async (action, payload) => {
  setHeartbeatTimeout();
  return await ocppClient.call(action, payload);
};

export const connectCSMS = async () => {
  try {
    // connect to the OCPP server
    await ocppClient.connect();

    // send a BootNotification request and await the response
    const bootResponse = await ocppClient.call("BootNotification", {
      reason: "PowerUp",
      chargingStation: {
        vendorName: station.SecurityCtrlr.OrganizationName,
        model: station.Model,
      },
    });

    // check that the server accepted the client
    if (bootResponse.status === "Accepted") {
      // read the current server time
      console.log("Server time:", bootResponse.currentTime);

      // set heartbeat interval
      station.OCPPCommCtrlr.HeartbeatInterval = bootResponse.interval;

      // send a StatusNotification request for the controller
      for (const evse of station.EVSEs) {
        for (const connector of evse.Connectors) {
          await ocppClientCall("StatusNotification", {
            evseId: evse.Id,
            connectorId: connector.Id,
            connectorStatus: "Available",
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  } catch (error) {
    setTimeout(async () => {
      await connectCSMS();
    }, ms("5s"));
  }
};

export const handleStartTransaction = async ({ triggerReason }) => {
  const { TxStartPoint } = station.TxCtrlr;
  const isPowerPathClosed = TxStartPoint.includes("PowerPathClosed");
  const isAuthenticated = station.Auth.Authenticated;
  const [evse] = station.EVSEs;
  const isOccupied = evse.AvailabilityState === "Occupied";
  if (isPowerPathClosed && isAuthenticated && isOccupied) {
    const transactionId = uuid();
    const meterValue = generateMeterValue();
    const [connector] = evse.Connectors;
    const [txStartedMeasurands] = station.SampledDataCtrlr.TxStartedMeasurands;
    const { idTokenInfo: { status } } = await ocppClientCall("TransactionEvent", {
      eventType: "Started",
      timestamp: new Date().toISOString(),
      triggerReason: triggerReason,
      seqNo: station.Transaction.SeqNo,
      transactionInfo: {
        transactionId: transactionId,
        chargingState: "Charging",
        remoteStartId: station.Auth.RemoteStartId,
      },
      idToken: station.Auth.IdToken,
      evse: {
        id: evse.Id,
        connectorId: connector.Id,
      },
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [
            {
              value: meterValue,
              measurand: txStartedMeasurands,
            }
          ]
        }
      ],
    });
    if (status === "Accepted") {
      station.Transaction.Id = transactionId;
      station.Transaction.OnGoing = true;
      station.Transaction.SeqNo++;
      sendJsonMessage({
        action: Action.METER_VALUE,
        payload: {
          value: meterValue,
        },
      });
      await handleUpdateTransaction();
    }
  }
};

let transactionUpdateTimeoutId = 0;
export const handleUpdateTransaction = async () => {
  clearTimeout(transactionUpdateTimeoutId);
  transactionUpdateTimeoutId = setTimeout(async () => {
    const meterValue = generateMeterValue();
    const { TxUpdatedMeasurands } = station.SampledDataCtrlr;
    const [txStartedMeasurands] = TxUpdatedMeasurands;
    await ocppClientCall("TransactionEvent", {
      eventType: "Updated",
      timestamp: new Date().toISOString(),
      triggerReason: "MeterValuePeriodic",
      seqNo: station.Transaction.SeqNo++,
      transactionInfo: {
        transactionId: station.Transaction.Id,
      },
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [
            {
              value: meterValue,
              measurand: txStartedMeasurands,
            }
          ]
        }
      ],
    });
    sendJsonMessage({
      action: Action.METER_VALUE,
      payload: {
        value: meterValue,
      },
    });
    await handleUpdateTransaction();
  }, ms(`${station.SampledDataCtrlr.TxUpdatedInterval}s`));
};

export const handleStopTransaction = async ({ triggerReason, stoppedReason }) => {
  const { OnGoing } = station.Transaction;
  const { TxStopPoint, StopTxOnEVSideDisconnect } = station.TxCtrlr;
  const isPowerPathClosed = TxStopPoint.includes("PowerPathClosed");
  const isStoppedByIdToken = triggerReason === "StopAuthorized";
  const isUnplugged = triggerReason === "EVCommunicationLost" && StopTxOnEVSideDisconnect;
  if (isPowerPathClosed && OnGoing && (isStoppedByIdToken || isUnplugged)) {
    clearTimeout(transactionUpdateTimeoutId);
    const meterValue = generateMeterValue();
    const [txEndedMeasurands] = station.SampledDataCtrlr.TxEndedMeasurands;
    const { idTokenInfo: { status } } = await ocppClientCall("TransactionEvent", {
      eventType: "Ended",
      timestamp: new Date().toISOString(),
      triggerReason: triggerReason,
      seqNo: station.Transaction.SeqNo++,
      transactionInfo: {
        transactionId: station.Transaction.Id,
        stoppedReason: stoppedReason,
      },
      idToken: station.Auth.IdToken,
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [
            {
              value: meterValue,
              measurand: txEndedMeasurands,
            }
          ]
        }
      ],
    });
    if (status === "Accepted") {
      station.initialize();
      sendJsonMessage({
        action: Action.SCAN_RFID,
        payload: { status: "Ended" },
      });
    }
  }
};

ocppClient.handle("RequestStartTransaction", ({ params }) => {
  if (station.Auth.Authenticated || station.Transaction.OnGoing) {
    return { status: "Rejected" };
  }
  const { idToken, remoteStartId } = params;
  station.Auth.Authenticated = true;
  station.Auth.IdToken = idToken;
  station.Auth.RemoteStartId = remoteStartId
  handleStartTransaction({
    triggerReason: "RemoteStart",
  });
  return { status: "Accepted" };
});

ocppClient.handle("RequestStopTransaction", ({ params }) => {
  const { transactionId } = params;
  if (station.Transaction.Id !== transactionId) {
    return { status: "Rejected" };
  }
  clearTimeout(transactionUpdateTimeoutId);
  const meterValue = generateMeterValue();
  const { TxUpdatedMeasurands } = station.SampledDataCtrlr;
  const [txStartedMeasurands] = TxUpdatedMeasurands;
  ocppClientCall("TransactionEvent", {
    eventType: "Updated",
    timestamp: new Date().toISOString(),
    triggerReason: "RemoteStop",
    seqNo: station.Transaction.SeqNo++,
    transactionInfo: {
      transactionId: transactionId,
      chargingState: "EVConnected",
    },
    meterValue: [
      {
        timestamp: new Date().toISOString(),
        sampledValue: [
          {
            value: meterValue,
            measurand: txStartedMeasurands,
          }
        ]
      }
    ],
  });
  return { status: "Accepted" };
});
