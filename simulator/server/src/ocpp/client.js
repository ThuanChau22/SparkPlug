import ms from "ms";
import { RPCClient } from "ocpp-rpc";
import { v4 as uuid } from "uuid";

import station from "../station.js";
import { Action, stateSync } from "../ws/message.js";
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
};

export const startTransaction = async ({ triggerReason, remoteStartId }) => {
  const meterValue = generateMeterValue();
  station.Transaction.Id = uuid();
  station.Transaction.OnGoing = true;
  const [evse] = station.EVSEs;
  const [connector] = evse.Connectors;
  const { TxStartedMeasurands } = station.SampledDataCtrlr;
  const [txStartedMeasurands] = TxStartedMeasurands;
  const transactionEventResponse = await ocppClientCall("TransactionEvent", {
    eventType: "Started",
    timestamp: new Date().toISOString(),
    triggerReason: triggerReason,
    seqNo: station.Transaction.SeqNo++,
    transactionInfo: {
      transactionId: station.Transaction.Id,
      chargingState: "Charging",
      remoteStartId
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
  if (transactionEventResponse.idTokenInfo?.status === "Accepted") {
    sendJsonMessage({
      action: Action.METER_VALUE,
      payload: {
        value: meterValue,
      },
    });
    await updateTransaction();
  } else {
    await ocppClientCall("TransactionEvent", {
      eventType: "Updated",
      timestamp: new Date().toISOString(),
      triggerReason: "Deauthorized",
      seqNo: station.Transaction.SeqNo++,
      transactionInfo: {
        transactionId: station.Transaction.Id,
        chargingState: "SuspendedEVSE",
      },
    });
    station.initialize();
    stateSync();
  }
};

let updateTimeout = 0;
export const updateTransaction = async () => {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(async () => {
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
    await updateTransaction();
  }, ms(`${station.SampledDataCtrlr.TxUpdatedInterval}s`));
};

export const stopTransaction = async ({ reason }) => {
  clearTimeout(updateTimeout);
  const { TxEndedMeasurands } = station.SampledDataCtrlr;
  const [txEndedMeasurands] = TxEndedMeasurands;
  const meterValue = generateMeterValue();
  const transactionEventResponse = await ocppClientCall("TransactionEvent", {
    eventType: "Ended",
    timestamp: new Date().toISOString(),
    triggerReason: "StopAuthorized",
    seqNo: station.Transaction.SeqNo++,
    transactionInfo: {
      transactionId: station.Transaction.Id,
      stoppedReason: reason,
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
  if (transactionEventResponse.idTokenInfo?.status === "Accepted") {
    station.initialize();
  }
  sendJsonMessage({
    action: Action.METER_VALUE,
    payload: {
      value: meterValue,
    },
  });
};

ocppClient.handle("RequestStartTransaction", ({ params }) => {
  if (station.Transaction.OnGoing) {
    return { status: "Rejected" };
  }
  const { idToken, remoteStartId } = params;
  station.Auth.Authenticated = true;
  station.Auth.IdToken = idToken;
  const { TxStartPoint } = station.TxCtrlr;
  const isPowerPathClosed = TxStartPoint.includes("PowerPathClosed");
  const [evse] = station.EVSEs;
  const isOccupied = evse.AvailabilityState === "Occupied";
  if (isPowerPathClosed && isOccupied) {
    startTransaction({ triggerReason: "RemoteStart", remoteStartId });
  }
  return { status: "Accepted" };
});

ocppClient.handle("RequestStopTransaction", ({ params }) => {
  if (!station.Transaction.OnGoing) {
    return { status: "Rejected" };
  }
  const { transactionId } = params;
  clearTimeout(updateTimeout);
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
