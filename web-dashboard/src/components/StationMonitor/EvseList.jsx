import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  CCard,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import MonitorEvseListItem from "components/StationMonitor/EvseListItem";
import useFetchData from "hooks/useFetchData";
import {
  evseGetByStation,
  selectEvseByStation,
} from "redux/evse/evseSlice";
import {
  evseStatusGetByStation,
  selectEvseStatusByStation,
} from "redux/evse/evseStatusSlice";

const StationMonitorEvseList = ({ stationId }) => {
  const evseList = useSelector((state) => selectEvseByStation(state, stationId));
  const evseStatusList = useSelector((state) => selectEvseStatusByStation(state, stationId));

  const { loadState: evseLoadState } = useFetchData({
    condition: evseList.length === 0,
    action: useCallback(() => evseGetByStation(stationId), [stationId]),
  });

  const { loadState: evseStatusLoadState } = useFetchData({
    condition: evseStatusList.length === 0,
    action: useCallback(() => evseStatusGetByStation(stationId), [stationId]),
  });

  const loading = useMemo(() => (
    evseLoadState.loading
    && evseStatusLoadState.loading
  ), [evseLoadState, evseStatusLoadState]);

  return (
    <CCard
      className="border-0 rounded-top-0 overflow-y-auto"
      style={{
        minHeight: window.innerHeight * 0.1,
        maxHeight: window.innerHeight * 0.3,
      }}
    >
      <CCardBody className="d-flex flex-column p-0">
        {loading
          ? <LoadingIndicator loading={loading} />
          : evseList.length > 0
            ? (
              <CListGroup className={evseList.length > 0 ? "mb-2" : ""}>
                {evseList.map(({ station_id, evse_id }) => (
                  <CListGroupItem key={`${station_id},${evse_id}`}>
                    <MonitorEvseListItem
                      stationId={station_id}
                      evseId={evse_id}
                    />
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
      </CCardBody>
    </CCard>
  );
};

export default StationMonitorEvseList;
