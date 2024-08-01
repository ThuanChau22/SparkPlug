import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CCard,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import MonitorEvseListItem from "components/StationMonitor/EvseListItem";
import {
  selectStationById,
} from "redux/station/stationSlide";
import {
  evseGetByStation,
  selectEvseByStation,
} from "redux/evse/evseSlice";

const StationMonitorEvseList = ({ stationId, remoteStart, remoteStop }) => {
  const station = useSelector((state) => selectStationById(state, stationId));
  const evseList = useSelector((state) => selectEvseByStation(state, stationId));

  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (evseList.length === 0) {
      await dispatch(evseGetByStation(station.id)).unwrap();
    }
    setLoading(false);
  }, [station, evseList, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <CCard
      className="border-0 rounded-top-0 overflow-y-auto"
      style={{ maxHeight: window.innerHeight * 0.3 }}
    >
      <CCardBody className="p-0">
        {loading
          ? <LoadingIndicator loading={loading} />
          : (
            <CListGroup className={evseList.length > 0 ? "mb-2" : ""}>
              {evseList.map(({ station_id, evse_id }) => (
                <CListGroupItem key={`${station_id},${evse_id}`}>
                  <MonitorEvseListItem
                    stationId={station_id}
                    evseId={evse_id}
                    remoteStart={remoteStart}
                    remoteStop={remoteStop}
                  />
                </CListGroupItem>
              ))}
            </CListGroup>
          )
        }
      </CCardBody>
    </CCard>
  );
};

export default StationMonitorEvseList;
