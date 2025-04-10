import { useEffect, useCallback } from "react";
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
import useFetchData from "hooks/useFetchData";
import useStationEventSocket from "hooks/useStationEventSocket";
import {
  stationEventStateSetById,
  stationEventGetById,
  stationEventStateClear,
  selectStationEventList,
} from "redux/station/stationEventSlice";

const StationMonitorEventList = ({ stationId }) => {
  const stationEventList = useSelector(selectStationEventList);

  const dispatch = useDispatch();

  const { loadState } = useFetchData({
    condition: stationEventList.length === 0,
    action: useCallback(() => stationEventGetById({ stationId }), [stationId]),
  });

  useStationEventSocket({
    onWatchAllEvent: useCallback((payload) => {
      dispatch(stationEventStateSetById(payload));
    }, [dispatch]),
  });

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
        {loadState.loading
          ? <LoadingIndicator loading={loadState.loading} />
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
