import useGetEvseStatusColor from "hooks/useGetEvseStatusColor";

const EvseAvailabilityStatus = ({ status }) => {
  const getColor = useGetEvseStatusColor();
  return (
    <span className={`text-${getColor(status)}`}>
      {status || "Unknown"}
    </span>
  )
};

export default EvseAvailabilityStatus;
