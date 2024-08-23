const ActiveStatus = ({ status }) => (
  <span
    className={
      status === "active"
        ? "text-success"
        : status === "terminated"
          ? "text-danger"
          : "text-warning"
    }>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

export default ActiveStatus;
