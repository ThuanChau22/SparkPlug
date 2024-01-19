const StationStatus = ({ status }) => {
  return (
    <span className={
      status === "Available"
        ? "text-success"
        : status === "Occupied"
          ? "text-warning"
          : status === "Reserved"
            ? "text-info"
            : status === "Unavailable" || status === "Faulted"
              ? "text-danger"
              : "text-secondary"
    }>
      {status}
    </span>
  );
};

export default StationStatus;
