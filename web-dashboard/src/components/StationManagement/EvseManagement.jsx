import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CCard,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import EvseAdd from "components/StationManagement/EvseAdd";
import EvseDetails from "components/StationManagement/EvseDetails";
import {
  selectStationById,
} from "redux/station/stationSlide";
import {
  evseGetByStation,
  selectEvseByStation,
} from "redux/evse/evseSlice";

const EvseManagement = ({ stationId }) => {
  const station = useSelector((state) => selectStationById(state, stationId));
  const evseList = useSelector((state) => selectEvseByStation(state, stationId));

  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (evseList.length === 0) {
      setLoading(true);
      await dispatch(evseGetByStation(station.id)).unwrap();
      setLoading(false);
    }
  }, [station, evseList, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <CCard
      className="border-0 rounded-top-0 overflow-y-auto"
      style={{ maxHeight: window.innerHeight * 0.5 }}
    >
      <CCardBody className="py-2">
        {loading
          ? <LoadingIndicator loading={loading} />
          : (
            <CListGroup className={evseList.length > 0 ? "mb-2" : ""}>
              {evseList.map(({ station_id, evse_id }) => (
                <CListGroupItem key={`${station_id},${evse_id}`}>
                  <EvseDetails stationId={station_id} evseId={evse_id} />
                </CListGroupItem>
              ))}
            </CListGroup>
          )
        }
        <EvseAdd stationId={stationId} />
      </CCardBody>
    </CCard>
  );
};

export default EvseManagement;