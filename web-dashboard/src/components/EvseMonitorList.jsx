import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GooeyCircleLoader } from "react-loaders-kit";
import {
  CContainer,
  CCard,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import EvseMonitorDetails from "./EvseMonitorDetails";
import {
  selectStationById,
} from "redux/station/stationSlide";
import {
  evseGetByStation,
  selectEvseByStation,
} from "redux/evse/evseSlice";

const EvseMonitorList = ({ stationId, remoteStart, remoteStop }) => {
  const station = useSelector((state) => selectStationById(state, stationId));
  const evseList = useSelector((state) => selectEvseByStation(state, stationId));
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (!station.evseDetailsLoaded) {
      await dispatch(evseGetByStation(station.id)).unwrap();
    }
    setLoading(false);
  }, [station, dispatch]);

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
          ? (
            <div
              className="d-flex align-items-center"
            >
              <CContainer className="d-flex flex-row justify-content-center">
                <GooeyCircleLoader
                  color={["#f6b93b", "#5e22f0", "#ef5777"]}
                  loading={true}
                />
              </CContainer>
            </div>
          )
          : (
            <CListGroup className={evseList.length > 0 ? "mb-2" : ""}>
              {evseList.map(({ station_id, evse_id }) => (
                <CListGroupItem key={`${station_id},${evse_id}`}>
                  <EvseMonitorDetails
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

export default EvseMonitorList;
