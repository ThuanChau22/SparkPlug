import cryptoJs from "crypto-js";
import { EventEmitter } from "events";
import { v4 as uuid } from "uuid";

class EVSE {
  _id;
  _available;
  _availabilityState;
  _power;
  _supplyPhases;
  _connectors;
  _eventEmitter;
  _isAuthorized;
  _idToken;
  _transactionId;
  _isTransactionStarted;
  _transactionSeqNo;
  _transactionUpdateTimeoutId;

  constructor({
    id,
    available = true,
    availabilityState = "Available",
    power = 0.0,
    supplyPhases = null,
    connectors = [],
  }) {
    this._id = id;
    this._available = available;
    this._availabilityState = availabilityState;
    this._power = power;
    this._supplyPhases = supplyPhases;
    this._connectors = connectors;
    this._eventEmitter = new EventEmitter();
    this._isAuthorized = false;
    this._idToken = null;
    this._transactionId = "";
    this._isTransactionStarted = false;
    this._transactionSeqNo = 0;
    this._transactionUpdateTimeoutId = 0;
  }

  get id() {
    return this._id;
  }

  get available() {
    return this._available;
  }

  get availabilityState() {
    return this._availabilityState;
  }

  get power() {
    return this._power;
  }

  get supplyPhases() {
    return this._supplyPhases;
  }

  get connectors() {
    return [...this._connectors];
  }

  get occupiedConnector() {
    const filter = (obj) => obj.availabilityState === "Occupied";
    const [connector] = this._connectors.filter(filter);
    return connector;
  }

  get isAuthorized() {
    return this._isAuthorized;
  }

  get isTransactionStarted() {
    return this._isTransactionStarted;
  }

  get transactionId() {
    return this._transactionId;
  }

  get hashedIdToken() {
    return cryptoJs.SHA256(JSON.stringify(this._idToken)).toString();
  }

  /**
   * Subscribe to Authorize event
   * @param {function} listener
   */
  onAuthorize(listener) {
    this._eventEmitter.on("Authorize", listener);
  }

  /**
   * Subscribe to MeterValueReport event during transaction
   * @param {function} listener
   */
  onMeterValueReport(listener) {
    this._eventEmitter.on("MeterValueReport", listener);
  }

  /**
   * Set current availability state
   * @param {string} state - Available, Occupied, Reserved, Unavailable, Faulted
   */
  setAvailabilityState(state) {
    const options = [
      "Available",
      "Occupied",
      "Reserved",
      "Unavailable",
      "Faulted",
    ];
    if (!options.includes(state)) {
      throw new Error(`Invalid availability state: ${state}`);
    }
    this._availabilityState = state;
  }

  /**
   * Set authorized idToken
   * @param {Object} idToken
   */
  authorized(idToken) {
    this._isAuthorized = true;
    this._idToken = idToken;
    this._eventEmitter.emit("Authorize", this, { isAuthorized: true });
  }

  /**
   * Deauthorized idToken
   */
  deauthorized() {
    this._isAuthorized = false;
    this._idToken = null;
    this._eventEmitter.emit("Authorize", this, { isAuthorized: false });
  }

  /**
   * Create start transaction event request
   * @param {string} triggerReason
   * @param {Array} measurands
   * @returns {Object}
   */
  startTransactionRequest({ triggerReason, remoteStartId, measurands }) {
    const request = {
      eventType: "Started",
      timestamp: new Date().toISOString(),
      triggerReason,
      seqNo: this._transactionSeqNo++,
      transactionInfo: {
        transactionId: uuid(),
        chargingState: "Charging",
      },
      idToken: this._idToken,
      evse: {
        id: this._id,
        connectorId: this.occupiedConnector.id,
      },
    };
    if (remoteStartId) {
      request.transactionInfo.remoteStartId = remoteStartId;
    }
    if (measurands) {
      request.meterValue = [
        {
          timestamp: new Date().toISOString(),
          sampledValue: measurands.map((measurand) => ({
            measurand,
            value: this.#simulateMeterValue(),
          })),
        }
      ];
    }
    return request;
  }

  /**
   * Create update transaction event request
   * @param {Array} measurands
   * @returns {Object}
   */
  updateTransactionRequest({ triggerReason, chargingState, measurands }) {
    const request = {
      eventType: "Updated",
      timestamp: new Date().toISOString(),
      triggerReason,
      seqNo: this._transactionSeqNo++,
      transactionInfo: {
        transactionId: this._transactionId,
      },
      evse: {
        id: this._id,
        connectorId: this.occupiedConnector.id,
      },
    };
    if (chargingState) {
      request.transactionInfo.chargingState = chargingState;
    }
    if (measurands) {
      request.meterValue = [
        {
          timestamp: new Date().toISOString(),
          sampledValue: measurands.map((measurand) => ({
            measurand,
            value: this.#simulateMeterValue(),
          })),
        }
      ];
    }
    return request;
  }

  stopTransactionRequest({ triggerReason, stoppedReason, measurands }) {
    const request = {
      eventType: "Ended",
      timestamp: new Date().toISOString(),
      triggerReason,
      seqNo: this._transactionSeqNo++,
      transactionInfo: {
        transactionId: this._transactionId,
        chargingState: "Idle",
        stoppedReason,
      },
      idToken: this._idToken,
      evse: {
        id: this._id,
        connectorId: this.occupiedConnector.id,
      },
    };
    if (measurands) {
      // request.meterValue = [
      //   {
      //     timestamp: new Date().toISOString(),
      //     sampledValue: measurands.map((measurand) => ({
      //       measurand,
      //       value: this.#simulateMeterValue(),
      //     })),
      //   }
      // ];
    }
    return request;
  }

  /**
   * Set transaction started
   * @param {string} transactionId
   */
  transactionStarted(transactionId) {
    this._transactionId = transactionId;
    this._isTransactionStarted = true;
  }

  /**
   * Set transaction updated
   * @param {Object} meterValue
   * @param {number} timeoutId
   */
  transactionUpdated(meterValue, timeoutId) {
    clearTimeout(this._transactionUpdateTimeoutId);
    this._transactionUpdateTimeoutId = timeoutId;
    this._eventEmitter.emit("MeterValueReport", this, { meterValue });
  }

  /**
   * Set transaction stopped
   */
  transactionStopped() {
    clearTimeout(this._transactionUpdateTimeoutId);
    this.deauthorized()
    this._transactionId = "";
    this._isTransactionStarted = false;
    this._transactionSeqNo = 0;
    this._transactionUpdateTimeoutId = 0;
  }

  /**
   * Clear evse state
   */
  clear() {
    this._eventEmitter.removeAllListeners();
  }

  /**
   * Simulate meter value
   * @return {number}
   */
  #simulateMeterValue() {
    const min = this.power - 0.1 * this.power;
    const max = this.power + 0.1 * this.power;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export default EVSE;
