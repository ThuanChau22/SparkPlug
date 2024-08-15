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
  evseGetByStation,
  selectEvseByStation,
} from "redux/evse/evseSlice";

const EvseManagement = ({ stationId }) => {
  const evseList = useSelector((state) => selectEvseByStation(state, stationId));

  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (evseList.length === 0) {
      setLoading(true);
      await dispatch(evseGetByStation(stationId)).unwrap();
      setLoading(false);
    }
  }, [stationId, evseList.length, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <CCard
      className="border-0 rounded-top-0 overflow-y-auto"
      style={{
        minHeight: window.innerHeight * 0.15,
        maxHeight: window.innerHeight * 0.5,
      }}
    >
      <CCardBody className="d-flex flex-column py-2">
        {loading
          ? <LoadingIndicator loading={loading} />
          : evseList.length > 0
            ? (
              <CListGroup className={evseList.length > 0 ? "mb-2" : ""}>
                {evseList.map(({ station_id, evse_id }) => (
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
