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
import StationAnalyticsDetailsModal from "components/StationAnalytics/DetailsModal";
import StationAnalyticsMapView from "components/StationAnalytics/MapView";
import {
  selectLayoutHeaderHeight,
} from "redux/layout/layoutSlice";
import {
  stationGetList,
  selectStationList,
} from "redux/station/stationSlice";

const StationAnalytics = () => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const stationList = useSelector(selectStationList);

  const [loading, setLoading] = useState(false);

  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [stationId, setStationId] = useState(null);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (stationList.length === 0) {
      setLoading(true);
      await dispatch(stationGetList()).unwrap();
      setLoading(false);
    }
  }, [stationList.length, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewStation = (stationId) => {
    setStationId(stationId);
    setIsAnalyticsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-top-0 rounded-0">
      <CRow xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="d-flex flex-column h-100 p-0 pb-3">
            <StickyContainer top={`${headerHeight}px`}>
              <CCardTitle
                className="p-3 shadow-sm"
                style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
              >
                Stations Analytics
              </CCardTitle>
            </StickyContainer>
            {loading
              ? <LoadingIndicator loading={loading} />
              : (
                <CListGroup className="px-3">
                  {stationList.map(({ id, name }) => (
                    <CListGroupItem
                      key={id}
                      className="py-3"
                      as="button"
                      onClick={() => handleViewStation(id)}
                    >
                      <small className="w-100 text-secondary">ID: {id}</small>
                      <p className="mb-0">{name}</p>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              )}
          </CCardBody>
        </CCol>
        <CCol md={6} lg={7}>
          <StationAnalyticsMapView handleViewStation={handleViewStation} />
        </CCol>
      </CRow>
      {isAnalyticsModalOpen && (
        <StationAnalyticsDetailsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
          stationId={stationId}
        />
      )}
    </CCard >
  );
};

export default StationAnalytics;
