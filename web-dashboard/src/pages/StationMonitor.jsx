import { useCallback, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CRow,
  CCol,
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import StickyContainer from "components/StickyContainer";
import StationMonitorListItem from "components/StationMonitor/StationListItem";
import StationMonitorDetailsModal from "components/StationMonitor/DetailsModal";
import StationMonitorMapView from "components/StationMonitor/MapView";
import useStationEventSocket, { Action } from "hooks/useStationEventSocket";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import {
  stationGetList,
  selectStationIds,
} from "redux/station/stationSlice";
import {
  evseStatusGetList,
  selectEvseStatusList,
} from "redux/evse/evseStatusSlice";

const StationMonitor = () => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const stationIds = useSelector(selectStationIds);
  const evseStatusList = useSelector(selectEvseStatusList);

  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stationId, setStationId] = useState(null);

  useStationEventSocket({
    action: Action.WatchStatusEvent,
    payload: { stationIds },
  });

  const dispatch = useDispatch();

  const fetchStationData = useCallback(async () => {
    if (stationIds.length === 0) {
      setLoading(true);
      await dispatch(stationGetList()).unwrap();
      setLoading(false);
    }
  }, [stationIds.length, dispatch]);

  const fetchEvseStatusData = useCallback(() => {
    if (evseStatusList.length === 0) {
      dispatch(evseStatusGetList());
    }
  }, [evseStatusList.length, dispatch]);

  useEffect(() => {
    fetchStationData();
    fetchEvseStatusData();
  }, [fetchStationData, fetchEvseStatusData]);

  const handleViewStation = (stationId) => {
    setStationId(stationId);
    setIsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CRow className="flex-grow-1" xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="d-flex flex-column h-100 p-0 pb-3">
            <StickyContainer style={{ top: `${headerHeight}px` }}>
              <CCardTitle
                className="p-3 shadow-sm"
                style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
              >
                Stations Monitor
              </CCardTitle>
            </StickyContainer>
            {loading
              ? <LoadingIndicator loading={loading} />
              : (
                <CListGroup className="px-3">
                  {stationIds.map((id) => (
                    <CListGroupItem
                      key={id}
                      className="d-flex justify-content-between align-items-center border rounded py-3 my-1 shadow-sm"
                      as="button"
                      onClick={() => handleViewStation(id)}
                    >
                      <StationMonitorListItem stationId={id} />
                    </CListGroupItem>
                  ))}
                </CListGroup>
              )}
          </CCardBody>
        </CCol>
        <CCol md={6} lg={7}>
          <StationMonitorMapView handleViewStation={handleViewStation} />
        </CCol>
      </CRow>
      {isModalOpen && (
        <StationMonitorDetailsModal
          stationId={stationId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </CCard>
  );
};

export default StationMonitor;
