import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
} from "@coreui/react";

import StationAddModal from "components/StationManagement/AddModal";
import StationDetailsModal from "components/StationManagement/DetailsModal";
import StationListView from "components/StationManagement/ListView";
import StationMapView from "components/StationManagement/MapView";
import useViewParam from "hooks/useViewParam";
import useSearchParam from "hooks/useSearchParam";
import useSearchParamsHandler from "hooks/useSearchParamsHandler";
import {
  LayoutView,
  layoutStateSetView,
  selectLayoutMobile,
  selectLayoutView,
} from "redux/app/layoutSlice";
import {
  mapStateSet,
  selectMapLowerBound,
  selectMapUpperBound,
} from "redux/map/mapSlice";
import {
  stationStateDeleteMany,
  stationStateClear,
  selectStationList,
} from "redux/station/stationSlice";
import {
  evseStateDeleteMany,
  evseStateClear,
  selectEvseList,
} from "redux/evse/evseSlice";
import utils from "utils";

const StationManagement = () => {
  const isMobile = useSelector(selectLayoutMobile);
  const layoutView = useSelector(selectLayoutView);

  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);

  const stationList = useSelector(selectStationList);
  const evseList = useSelector(selectEvseList);

  const [viewParam] = useViewParam();
  const [searchParam] = useSearchParam();

  const {
    syncSearchParams,
    clearSearchOnMap,
    setViewOnMobile,
    clearMapOnSearchInMobileListView,
  } = useSearchParamsHandler();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [stationId, setStationId] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    syncSearchParams();
  }, [syncSearchParams]);

  useEffect(() => {
    clearSearchOnMap();
  }, [clearSearchOnMap]);

  useEffect(() => {
    setViewOnMobile();
  }, [setViewOnMobile]);

  useEffect(() => {
    clearMapOnSearchInMobileListView();
  }, [clearMapOnSearchInMobileListView]);

  useEffect(() => {
    if (isMobile && viewParam) {
      dispatch(layoutStateSetView(viewParam));
    }
  }, [isMobile, viewParam, dispatch]);

  useEffect(() => {
    if (searchParam) {
      dispatch(mapStateSet({
        center: null,
        lowerBound: null,
        upperBound: null,
        zoom: null,
      }));
      dispatch(stationStateClear());
      dispatch(evseStateClear());
    }
  }, [searchParam, dispatch]);

  useEffect(() => {
    const stationIds = utils.outOfBoundResources(stationList, {
      lowerBound: mapLowerBound,
      upperBound: mapUpperBound,
    }).map(({ id }) => id);
    dispatch(stationStateDeleteMany(stationIds));
  }, [stationList, mapLowerBound, mapUpperBound, dispatch]);

  useEffect(() => {
    const evseIds = utils.outOfBoundResources(evseList, {
      lowerBound: mapLowerBound,
      upperBound: mapUpperBound,
    }).map(({ station_id, evse_id }) => ({ station_id, evse_id }));
    dispatch(evseStateDeleteMany(evseIds));
  }, [evseList, mapLowerBound, mapUpperBound, dispatch]);

  useEffect(() => () => {
    dispatch(stationStateClear());
    dispatch(evseStateClear());
  }, [dispatch]);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleOpenViewModal = (stationId) => {
    setStationId(stationId);
    setIsDetailsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CCardBody className="d-flex flex-column h-100 p-0">
        <CRow className="flex-grow-1" xs={{ gutterX: 0 }}>
          {(!isMobile || layoutView === LayoutView.List) && (
            <CCol md={6} lg={5} xl={4}>
              <StationListView
                title={"Station Management"}
                openAddModal={handleOpenAddModal}
                openViewModal={handleOpenViewModal}
              />
            </CCol>
          )}
          {(!isMobile || layoutView === LayoutView.Map) && (
            <CCol md={6} lg={7} xl={8}>
              <StationMapView openViewModal={handleOpenViewModal} />
            </CCol>
          )}
        </CRow>
      </CCardBody>
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
