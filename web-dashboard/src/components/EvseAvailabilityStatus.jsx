import { EvseStatus } from "redux/evse/evseStatusSlice";

const EvseAvailabilityStatus = ({ status }) => (
  <span className={
    status === EvseStatus.Available
      ? "text-success"
      : status === EvseStatus.Occupied
        ? "text-warning"
        : status === EvseStatus.Reserved
          ? "text-info"
          : status === EvseStatus.Faulted
            ? "text-danger"
            : "text-secondary"
  }>
    {status || "Unknown"}
  </span>
);

export default EvseAvailabilityStatus;
