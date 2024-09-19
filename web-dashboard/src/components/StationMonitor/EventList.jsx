import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CCard,
  CCardBody,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import {
  stationEventGetById,
  stationEventStateClear,
  selectStationEventList,
} from "redux/station/stationEventSlice";

const StationMonitorEventList = ({ stationId }) => {
  const stationEventList = useSelector(selectStationEventList);

  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (stationEventList.length === 0) {
      setLoading(true);
      await dispatch(stationEventGetById(stationId)).unwrap();
      setLoading(false);
    }
  }, [stationId, stationEventList.length, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => () => dispatch(stationEventStateClear()), [dispatch]);

  return (
    <CCard
      className="overflow-y-auto"
      style={{
        minHeight: window.innerHeight * 0.15,
        maxHeight: window.innerHeight * 0.5
      }}
    >
      <CCardBody className="d-flex flex-column p-0">
        {loading
          ? <LoadingIndicator loading={loading} />
          : stationEventList.length > 0
            ? (
              <CAccordion
                alwaysOpen
                className="d-flex flex-column p-0"
              >
                {stationEventList.map(({ id, event, payload, createdAt }) => (
                  <CAccordionItem
                    key={id}
                    className="border border-top-0 rounded-0"
                  >
                    <CAccordionHeader>
                      {createdAt} - {event}
                    </CAccordionHeader>
                    <CAccordionBody>
                      <pre>
                        {JSON.stringify({
                          event,
                          payload,
                          createdAt,
                        }, null, 2)}
                      </pre>
                    </CAccordionBody>
                  </CAccordionItem>
                ))}
              </CAccordion>
            )
            : (
              <div className="d-flex flex-grow-1 justify-content-center align-items-center">
                <span className="text-secondary">Station event not available</span>
              </div>
            )
        }
      </CCardBody>
    </CCard>
  );
};

export default StationMonitorEventList;
