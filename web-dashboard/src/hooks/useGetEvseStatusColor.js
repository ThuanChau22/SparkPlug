import { EvseStatus } from "redux/evse/evseStatusSlice";

const useGetEvseStatusColor = () => (status) => (
  status === EvseStatus.Available
    ? "success"
    : status === EvseStatus.Occupied
      ? "warning"
      : status === EvseStatus.Reserved
        ? "info"
        : status === EvseStatus.Faulted
          ? "danger"
          : "secondary"
);

export default useGetEvseStatusColor;
