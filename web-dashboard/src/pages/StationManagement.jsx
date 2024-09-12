import { useCallback, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
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
import StationAddModal from "components/StationManagement/AddModal";
import StationDetailsModal from "components/StationManagement/DetailsModal";
import StationMapView from "components/StationManagement/MapView";
import {
  selectLayoutHeaderHeight,
} from "redux/layout/layoutSlice";
import {
  stationGetList,
  selectStationList,
} from "redux/station/stationSlice";

const StationManagement = () => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);
  const stationList = useSelector(selectStationList);

  const [loading, setLoading] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
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
    setIsDetailsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CRow xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="d-flex flex-column h-100 p-0 pb-3">
            <StickyContainer style={{ top: `${headerHeight}px` }}>
              <CCardTitle
                className="d-flex flex-row justify-content-between align-items-center px-3 py-2 shadow-sm"
                style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
              >
                Stations Management
                <CButton
                  variant="outline"
                  color="info"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Add Station
                </CButton>
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
          <StationMapView handleViewStation={handleViewStation} />
        </CCol>
      </CRow>
      {isAddModalOpen && (
        <StationAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
      {isDetailsModalOpen && (
        <StationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          stationId={stationId}
        />
      )}
    </CCard>
  );
};

export default StationManagement;
