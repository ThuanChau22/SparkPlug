import {
  STATION_IDENTITY,
  STATION_PASSWORD,
  STATION_CONFIGURATION,
} from "./config.js";

const station = {
  Model: "",
  Available: false,
  AvailabilityState: "Unavailable",
  EVSEs: [
    {
      Id: 0,
      Available: false,
      AllowReset: false,
      AvailabilityState: "Unavailable",
      Power: 0.0,
      Connectors: [
        {
          Id: 0,
          Available: false,
          AvailabilityState: "Unavailable",
          ConnectorType: "",
        },
      ],
    },
  ],
  AuthCtrlr: {
    Enabled: false,
    AuthorizeRemoteStart: false,
  },
  OCPPCommCtrlr: {
    Enabled: false,
    HeartbeatInterval: 0,
  },
  SampledDataCtrlr: {
    TxStartedMeasurands: [],
    TxUpdatedMeasurands: [],
    TxEndedMeasurands: [],
    TxUpdatedInterval: 0,
    TxEndedInterval: 0,
  },
  SecurityCtrlr: {
    Enabled: false,
    BasicAuthPassword: "",
    Identity: "",
    OrganizationName: "",
  },
  TxCtrlr: {
    EVConnectionTimeOut: 0,
    StopTxOnEVSideDisconnect: false,
    TxStartPoint: [""],
    TxStopPoint: [""],
  },
  Auth: {
    Authenticated: false,
    IdToken: {},
  },
  Transaction: {
    Id: "",
    OnGoing: false,
    SeqNo: 0,
  }
};

station.initialize = () => {
  station.Auth.Authenticated = false;
  station.Auth.IdToken = {};
  station.Transaction.Id = "";
  station.Transaction.OnGoing = false;
  station.Transaction.SeqNo = 0;
};

try {
  const config = JSON.parse(STATION_CONFIGURATION);
  station.Model = config.Model;
  station.Available = config.Available;
  station.AvailabilityState = config.AvailabilityState;
  station.EVSEs = config.EVSEs;
  station.AuthCtrlr = config.AuthCtrlr;
  station.OCPPCommCtrlr = config.OCPPCommCtrlr;
  station.SampledDataCtrlr = config.SampledDataCtrlr
  station.SecurityCtrlr = config.SecurityCtrlr;
  station.TxCtrlr = config.TxCtrlr;
  station.SecurityCtrlr.Identity = STATION_IDENTITY;
  station.SecurityCtrlr.BasicAuthPassword = STATION_PASSWORD;
} catch (error) {
  console.log(error);
}

export default station;