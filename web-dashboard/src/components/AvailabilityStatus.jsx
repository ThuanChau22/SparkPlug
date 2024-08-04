const AvailabilityStatus = ({ status }) => (
  <span className={
    status === "Available"
      ? "text-success"
      : status === "Occupied"
        ? "text-warning"
        : status === "Reserved"
          ? "text-info"
          : status === "Faulted"
            ? "text-danger"
            : "text-secondary"
  }>
    {status || "Unknown"}
  </span>
);

export default AvailabilityStatus;
