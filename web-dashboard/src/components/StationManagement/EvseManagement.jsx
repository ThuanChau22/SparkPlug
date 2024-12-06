import { useCallback } from "react";
import { useSelector } from "react-redux";
import {
  CCard,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import EvseAdd from "components/StationManagement/EvseAdd";
import EvseDetails from "components/StationManagement/EvseDetails";
import useFetchData from "hooks/useFetchData";
import {
  evseGetByStation,
  selectEvseByStation,
} from "redux/evse/evseSlice";

const EvseManagement = ({ stationId }) => {
  const evseByStationList = useSelector((state) => {
    return selectEvseByStation(state, stationId);
  });
  const { loadState } = useFetchData({
    condition: evseByStationList.length === 0,
    action: useCallback(() => evseGetByStation(stationId), [stationId]),
  });
  return (
    <CCard
      className="border-0 rounded-top-0 overflow-y-auto"
      style={{
        minHeight: window.innerHeight * 0.15,
        maxHeight: window.innerHeight * 0.5,
      }}
    >
      <CCardBody className="d-flex flex-column py-2">
        {loadState.loading
          ? <LoadingIndicator loading={loadState.loading} />
          : evseByStationList.length > 0
            ? (
              <CListGroup className={evseByStationList.length > 0 ? "mb-2" : ""}>
                {evseByStationList.map(({ station_id, evse_id }) => (
                  <CListGroupItem key={`${station_id},${evse_id}`}>
                    <EvseDetails stationId={station_id} evseId={evse_id} />
                  </CListGroupItem>
                ))}
              </CListGroup>
            )
            : (
              <div className="d-flex flex-grow-1 justify-content-center align-items-center">
                <span className="text-secondary">Station has no EVSE unit</span>
              </div>
            )
        }
        <EvseAdd stationId={stationId} />
      </CCardBody>
    </CCard>
  );
};

export default EvseManagement;
