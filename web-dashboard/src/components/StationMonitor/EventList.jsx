import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  CCard,
  CCardBody,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import { apiInstance } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";

const StationMonitorEventList = ({ stationId, eventMessages, setEventMessages }) => {
  const StationEventAPI = process.env.REACT_APP_STATION_EVENT_API_ENDPOINT;

  const token = useSelector(selectAuthAccessToken);

  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = `${StationEventAPI}/${stationId}`;
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await apiInstance.get(baseUrl, { headers });
      setEventMessages(data);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  }, [StationEventAPI, stationId, token, setEventMessages]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <CCard
      className="rounded-top-0 overflow-y-auto"
      style={{ maxHeight: window.innerHeight * 0.5 }}
    >
      <CCardBody className="p-0">
        <CAccordion
          alwaysOpen
          className="d-flex flex-column-reverse p-0"
        >
          {loading
            ? <LoadingIndicator loading={loading} />
            : eventMessages.length > 0
              ? eventMessages.map(({ id, event, payload, createdAt }) => (
                <CAccordionItem
                  key={id}
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
              ))
              : (
                <div className="text-secondary text-center" >
                  Station event not available
                </div>
              )}
        </CAccordion>
      </CCardBody>
    </CCard>
  );
};

export default StationMonitorEventList;
