import remoteControl from "../ocpp/messages/remote-control.js";
import { clients } from "../ocpp/server.js";
import { sendJsonMessage } from "./server.js";

export const Action = {
  METER_VALUE: "MeterValue",
  REMOTE_START: "RemoteStart",
  REMOTE_STOP: "RemoteStop",
};

export const handleMeterValue = async (payload) => {
  sendJsonMessage({
    action: Action.METER_VALUE,
    payload,
  });
};

export const handleRemoteStart = async (payload) => {
  const client = clients.get(payload.identity);
  const response = await remoteControl.requestStartTransactionRequest({ client });
  sendJsonMessage({
    action: Action.REMOTE_START,
    payload: { response },
  });
};

export const handleRemoteStop = async (payload) => {
  const client = clients.get(payload.identity);
  const response = await remoteControl.requestStopTransactionRequest({ client });
  sendJsonMessage({
    action: Action.REMOTE_STOP,
    payload: { response },
  });
};
