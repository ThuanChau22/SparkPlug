import cryptoJs from "crypto-js";
import { EventEmitter } from "events";
import ms from "ms";
import { RPCClient } from "ocpp-rpc";
import WebSocket from "ws";

import { CSMS_WS_ENDPOINT } from "../config.js";

class Station {
  _model;
  _available;
  _availabilityState;
  _supplyPhases;
  _evses;
  _ocppCommCtrlr = {
    messageTimeout: 60,
    fileTransferProtocols: "",
    heartbeatInterval: 30,
    networkConfigurationPriority: "",
    networkProfileConnectionAttempts: 0,
    offlineThreshold: 0,
    messageAttempts: 0,
    messageAttemptInterval: 0,
    unlockOnEVSideDisconnect: false,
    resetRetries: 0,
  };
  _securityCtrlr = {
    basicAuthPassword: "",
    identity: "",
    organizationName: "SparkPlug",
    certificateEntries: 0,
    securityProfile: 0,
  };
  _authCtrlr = {
    enabled: true,
    authorizeRemoteStart: true,
    localAuthorizeOffline: false,
    localPreAuthorize: false,
  };
  _txCtrlr = {
    evConnectionTimeOut: 0,
    stopTxOnEVSideDisconnect: true,
    txStartPoint: ["PowerPathClosed"],
    txStopPoint: ["PowerPathClosed"],
    stopTxOnInvalidId: false,
  };
  _sampledDataCtrlr = {
    enabled: true,
    txStartedMeasurands: ["Energy.Active.Import.Register"],
    txUpdatedMeasurands: ["Energy.Active.Import.Register"],
    txEndedMeasurands: ["Energy.Active.Import.Register"],
    txUpdatedInterval: 3,
    txEndedInterval: 0,
  };
  _isBooted;
  _heartbeatTimeoutId;
  _idTokenToEVSE;
  _transactionIdToEVSE;
  _evseIdToRemoteId;
  _eventEmitter;
  _rpcClient;

  constructor({
    id,
    model = "VirtualStation",
    available = true,
    availabilityState = "Available",
    supplyPhases = null,
    evses = [],
    ocppCommCtrlr = {},
    securityCtrlr = {},
    authCtrlr = {},
    txCtrlr = {},
    sampledDataCtrlr = {},
  }) {
    this._model = model;
    this._available = available;
    this._availabilityState = availabilityState;
    this._supplyPhases = supplyPhases;
    this._evses = evses;
    this._ocppCommCtrlr = { ...this._ocppCommCtrlr, ...ocppCommCtrlr };
    this._securityCtrlr = { ...this._securityCtrlr, ...securityCtrlr, identity: id };
    this._authCtrlr = { ...this._authCtrlr, ...authCtrlr };
    this._txCtrlr = { ...this._txCtrlr, ...txCtrlr };
    this._sampledDataCtrlr = { ...this._sampledDataCtrlr, ...sampledDataCtrlr };
    this._isBooted = false;
    this._heartbeatTimeoutId = 0;
    this._idTokenToEVSE = new Map();
    this._transactionIdToEVSE = new Map();
    this._evseIdToRemoteId = new Map();
    this._eventEmitter = new EventEmitter();
    this._rpcClient = new RPCClient({
      identity: this._securityCtrlr.identity,
      password: this._securityCtrlr.basicAuthPassword,
      endpoint: CSMS_WS_ENDPOINT,
      protocols: ["ocpp2.0.1"],
      strictMode: true,
    });
    this._rpcClient.on("open", async () => {
      if (this.isConnected && this._isBooted) {
        await this.#statusNotificationRequest();
      }
    });
    this._rpcClient.handle("RequestStartTransaction", ({ params }) => {
      try {
        const { evseId, remoteStartId, idToken } = params;
        this.#validateEVSEId(evseId);
        const evse = this._evses[evseId - 1];
        if (evse.isAuthorized || evse.isTransactionStarted) {
          return { status: "Rejected" };
        }
        this._evseIdToRemoteId.set(evseId, {
          startId: remoteStartId,
          isStopped: false,
        });
        this._eventEmitter.emit("RequestStartTransaction", this, { evseId, idToken });
        return { status: "Accepted" };
      } catch (error) {
        return { status: "Rejected" };
      }
    });
    this._rpcClient.handle("RequestStopTransaction", ({ params }) => {
      try {
        const { transactionId } = params;
        const evse = this._transactionIdToEVSE.get(transactionId);
        if (!evse) {
          return { status: "Rejected" };
        }
        const evseId = evse.id;
        this._eventEmitter.emit("RequestStopTransaction", this, { evseId });
        return { status: "Accepted" };
      } catch (error) {
        return { status: "Rejected" };
      }
    });
  }

  get id() {
    return this._securityCtrlr.identity;
  }

  get model() {
    return this._model;
  }

  get available() {
    return this._available;
  }

  get availabilityState() {
    return this._availabilityState;
  }

  get supplyPhases() {
    return this._supplyPhases;
  }

  get evses() {
    return [...this._evses];
  }

  get isConnected() {
    return this._rpcClient.state === WebSocket.OPEN;
  }

  /**
   * Subscribe to RequestStartTransaction event from CSMS
   * @param {function} listener
   */
  onRequestStartTransaction(listener) {
    this._eventEmitter.on("RequestStartTransaction", listener);
  }

  /**
   * Subscribe to RequestStopTransaction event from CSMS
   * @param {function} listener
   */
  onRequestStopTransaction(listener) {
    this._eventEmitter.on("RequestStopTransaction", listener);
  }

  /**
   * Connect to CSMS
   */
  async connect() {
    if (this.isConnected) {
      throw new Error("Station is already connected");
    }
    await this._rpcClient.connect();
    const response = await this._rpcClient.call(
      "BootNotification",
      {
        reason: "PowerUp",
        chargingStation: {
          vendorName: this._securityCtrlr.organizationName,
          model: this._model,
        },
      }
    );
    if (response.status === "Accepted") {
      this._isBooted = true;
      this._ocppCommCtrlr.heartbeatInterval = response.interval;
      console.log(`Station ${this.id} - Server time: ${response.currentTime}`);
      await this.#statusNotificationRequest();
    }
  }

  /**
   * Disconnected from CSMS
   */
  async disconnect() {
    if (!this.isConnected) {
      throw new Error("Station is not connected");
    }
    await this._rpcClient.close();
    this._isBooted = false;
    clearTimeout(this._heartbeatTimeoutId);
    console.log(`Station ${this.id} - Disconnected`);
  }

  /**
   * Authorize with idToken
   * @param {number} evseId
   * @param {Object} idToken
   */
  async authorize(evseId, idToken) {
    if (!this.isConnected) {
      throw new Error("Station is not connected");
    }
    this.#validateEVSEId(evseId);
    const evse = this._evses[evseId - 1];
    const hashedIdToken = cryptoJs.SHA256(JSON.stringify(idToken)).toString();
    const authEvse = this._idTokenToEVSE.get(hashedIdToken);
    if ((!authEvse || authEvse.id !== evseId) && evse.isAuthorized) {
      throw new Error("Already authorized by another identifier");
    }
    if ((!authEvse || authEvse.id !== evseId) && authEvse?.isTransactionStarted) {
      throw new Error("Identifier is participating in a transaction");
    }
    const isNewAuth = !authEvse && !evse.isAuthorized;
    const isUpdateAuth = authEvse
      && authEvse.id !== evseId
      && !authEvse.isTransactionStarted
      && !evse.isAuthorized;
    const isDeleteAuth = authEvse?.id === evseId;
    if (isNewAuth || (isDeleteAuth && !evse.isTransactionStarted)) {
      const response = await this.#rpcClientCall("Authorize", { idToken });
      const { idTokenInfo: { status } } = response;
      if (status !== "Accepted") {
        throw new Error("Identifier is not accepted");
      }
    }
    if (isUpdateAuth) {
      authEvse.deauthorized();
    }
    if (isNewAuth || isUpdateAuth) {
      this._idTokenToEVSE.set(hashedIdToken, evse);
      evse.authorized(idToken);
      await this.#startTransaction(evse, { triggerReason: "Authorized" });
    }
    if (isDeleteAuth && evse.isTransactionStarted) {
      await this.#stopTransaction(evse, {
        triggerReason: "StopAuthorized",
        stoppedReason: "Local",
      });
    }
    if (isDeleteAuth) {
      this._idTokenToEVSE.delete(hashedIdToken);
      evse.deauthorized();
    }
  }

  /**
   * Plugin connector
   * @param {number} evseId
   * @param {number} connectorId
   */
  async pluginConnector(evseId, connectorId) {
    if (!this.isConnected) {
      throw new Error("Station is not connected");
    }
    this.#validateConnectorId(evseId, connectorId);
    const evse = this._evses[evseId - 1];
    const connectorStatus = "Occupied";
    for (const connector of evse.connectors) {
      if (connector.availabilityState === connectorStatus) {
        throw new Error("A connector has been occupied");
      }
    }
    const connector = evse.connectors[connectorId - 1];
    evse.setAvailabilityState(connectorStatus);
    connector.setAvailabilityState(connectorStatus);
    await this.#rpcClientCall("StatusNotification", {
      evseId, connectorId, connectorStatus,
      timestamp: new Date().toISOString(),
    });
    await this.#startTransaction(evse, { triggerReason: "CablePluggedIn" });
  }

  /**
   * Unplug connector
   * @param {number} evseId
   * @param {number} connectorId
   */
  async unplugConnector(evseId, connectorId) {
    if (!this.isConnected) {
      throw new Error("Station is not connected");
    }
    this.#validateConnectorId(evseId, connectorId);
    const evse = this._evses[evseId - 1];
    const connector = evse.connectors[connectorId - 1];
    const connectorStatus = "Available";
    if (connector.availabilityState === connectorStatus) {
      throw new Error("Connector is already available");
    }
    await this.#stopTransaction(evse, {
      triggerReason: "EVCommunicationLost",
      stoppedReason: "EVDisconnected",
    });
    evse.setAvailabilityState(connectorStatus);
    connector.setAvailabilityState(connectorStatus);
    await this.#rpcClientCall("StatusNotification", {
      evseId, connectorId, connectorStatus,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle remote start transaction
   * @param {number} evseId
   * @param {Object} idToken
   */
  async remoteStartTransaction(evseId, idToken) {
    if (!this.isConnected) {
      throw new Error("Station is not connected");
    }
    this.#validateEVSEId(evseId);
    const evse = this._evses[evseId - 1];
    const hashedIdToken = cryptoJs.SHA256(JSON.stringify(idToken)).toString();
    this._idTokenToEVSE.set(hashedIdToken, evse);
    evse.authorized(idToken);
    await this.#startTransaction(evse);
  }

  /**
   * Handle remote stop transaction
   * @param {number} evseId
   */
  async remoteStopTransaction(evseId) {
    if (!this.isConnected) {
      throw new Error("Station is not connected");
    }
    this.#validateEVSEId(evseId);
    const remoteId = this._evseIdToRemoteId.get(evseId);
    if (remoteId) {
      this._evseIdToRemoteId.set(evseId, {
        ...remoteId,
        isStopped: true,
      });
    }
  }

  #validateEVSEId(evseId) {
    if (!evseId || evseId < 1 || evseId > this._evses.length) {
      throw new Error(`EVSE ID out of range: ${evseId}`);
    }
  }

  #validateConnectorId(evseId, connectorId) {
    this.#validateEVSEId(evseId);
    const evse = this._evses[evseId - 1];
    if (!connectorId || connectorId < 1 || connectorId > evse.connectors.length) {
      throw new Error(`Connector ID out of range: ${connectorId}`);
    }
  }

  async #statusNotificationRequest() {
    for (const evse of Object.values(this.evses)) {
      for (const connector of Object.values(evse.connectors)) {
        await this.#rpcClientCall("StatusNotification", {
          evseId: evse.id,
          connectorId: connector.id,
          connectorStatus: evse.availabilityState,
          timestamp: new Date().toISOString(),
        });
      }
    }
  };

  async #rpcClientCall(action, payload) {
    this.#heartbeatRequest();
    return await this._rpcClient.call(action, payload);
  };

  #heartbeatRequest() {
    clearTimeout(this._heartbeatTimeoutId);
    this._heartbeatTimeoutId = setTimeout(async () => {
      try {
        if (this.isConnected) {
          const response = await this._rpcClient.call("Heartbeat", {});
          console.log(`Station ${this.id} - Server time: ${response.currentTime}`);
          this.#heartbeatRequest();
        }
      } catch (error) {
        console.log(error);
      }
    }, ms(`${this._ocppCommCtrlr.heartbeatInterval}s`));
  };

  async #startTransaction(evse, { triggerReason = "ChargingStateChanged" } = {}) {
    if (
      this._txCtrlr.txStartPoint.includes("PowerPathClosed")
      && (!this._authCtrlr.enabled || evse.isAuthorized)
      && evse.availabilityState === "Occupied"
    ) {
      const { txStartedMeasurands } = this._sampledDataCtrlr;
      const { startId } = this._evseIdToRemoteId.get(evse.id) || {};
      triggerReason = startId ? "RemoteStart" : triggerReason;
      const request = evse.startTransactionRequest({
        triggerReason,
        remoteStartId: startId,
        measurands: txStartedMeasurands,
      });
      const response = await this.#rpcClientCall("TransactionEvent", request);
      const { idTokenInfo: { status } } = response;
      if (status === "ConcurrentTx") {
        throw new Error("Multiple transactions are not allowed");
      }
      if (status !== "Accepted") {
        throw new Error("Identifier is not accepted");
      }
      const { transactionInfo: { transactionId }, meterValue } = request;
      evse.transactionStarted(transactionId);
      this._transactionIdToEVSE.set(transactionId, evse);
      const timeoutId = this.#updateTransaction(evse);
      evse.transactionUpdated(meterValue, timeoutId);
    }
  }

  #updateTransaction(evse, { triggerReason = "MeterValuePeriodic" } = {}) {
    return setTimeout(async () => {
      try {
        if (this.isConnected) {
          const { isStopped } = this._evseIdToRemoteId.get(evse.id) || {};
          triggerReason = isStopped ? "RemoteStop" : triggerReason;
          const { txUpdatedMeasurands } = this._sampledDataCtrlr;
          const request = evse.updateTransactionRequest({
            triggerReason,
            chargingState: isStopped ? "EVConnected" : "",
            measurands: txUpdatedMeasurands,
          });
          await this.#rpcClientCall("TransactionEvent", request);
          const timeoutId = isStopped ? 0 : this.#updateTransaction(evse);
          evse.transactionUpdated(request.meterValue, timeoutId);
        }
      } catch (error) {
        console.log(error);
      }
    }, ms(`${this._sampledDataCtrlr.txUpdatedInterval}s`));
  }

  async #stopTransaction(evse, { triggerReason = "ChargingStateChanged", stoppedReason = "Local" } = {}) {
    const { stopTxOnEVSideDisconnect } = this._txCtrlr;
    const isUnplugged = stopTxOnEVSideDisconnect && triggerReason === "EVCommunicationLost";
    const isDeauthorized = triggerReason === "StopAuthorized";
    if (
      this._txCtrlr.txStartPoint.includes("PowerPathClosed")
      && evse.isTransactionStarted
      && (isDeauthorized || isUnplugged)
    ) {
      const { isStopped } = this._evseIdToRemoteId.get(evse.id) || {};
      const { txEndedMeasurands } = this._sampledDataCtrlr;
      const request = evse.stopTransactionRequest({
        triggerReason: isStopped ? "RemoteStop" : triggerReason,
        stoppedReason: isStopped ? "Remote" : stoppedReason,
        measurands: txEndedMeasurands,
      });
      const response = await this.#rpcClientCall("TransactionEvent", request);
      const { idTokenInfo: { status } } = response;
      if (status !== "Accepted") {
        throw new Error("Identifier is not accepted");
      }
      this._idTokenToEVSE.delete(evse.hashedIdToken);
      this._transactionIdToEVSE.delete(evse.transactionId);
      this._evseIdToRemoteId.delete(evse.id);
      evse.transactionStopped();
    }
  }
}

export default Station;
