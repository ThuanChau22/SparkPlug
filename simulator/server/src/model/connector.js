class Connector {
  _id;
  _available;
  _availabilityState;
  _connectorType;
  _supplyPhases;

  constructor({
    id,
    available = true,
    availabilityState = "Available",
    connectorType = "",
    supplyPhases = null,
  }) {
    this._id = id;
    this._available = available;
    this._availabilityState = availabilityState;
    this._connectorType = connectorType;
    this._supplyPhases = supplyPhases;
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

  get connectorType() {
    return this._connectorType;
  }

  get supplyPhases() {
    return this._supplyPhases;
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
}

export default Connector;
