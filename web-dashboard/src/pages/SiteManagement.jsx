import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
} from "@coreui/react";

import SiteAddModal from "components/SiteManagement/AddModal";
import SiteDetailsModal from "components/SiteManagement/DetailsModal";
import SiteListView from "components/SiteManagement/ListView";
import SiteMapView from "components/SiteManagement/MapView";
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
  siteStateDeleteMany,
  siteStateClear,
  selectSiteList,
} from "redux/site/siteSlice";
import utils from "utils";

const SiteManagement = () => {
  const isMobile = useSelector(selectLayoutMobile);
  const layoutView = useSelector(selectLayoutView);

  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);

  const siteList = useSelector(selectSiteList);

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
  const [siteId, setSiteId] = useState(null);

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
      dispatch(siteStateClear());
    }
  }, [searchParam, dispatch]);

  useEffect(() => {
    const siteIds = utils.outOfBoundResources(siteList, {
      lowerBound: mapLowerBound,
      upperBound: mapUpperBound,
    }).map(({ id }) => id);
    dispatch(siteStateDeleteMany(siteIds));
  }, [siteList, mapLowerBound, mapUpperBound, dispatch]);

  useEffect(() => () => dispatch(siteStateClear()), [dispatch]);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleOpenViewModal = (siteId) => {
    setSiteId(siteId);
    setIsDetailsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CCardBody className="p-0">
        <CRow xs={{ gutterX: 0 }}>
          {(!isMobile || layoutView === LayoutView.List) && (
            <CCol md={6} lg={5} xl={4}>
              <SiteListView
                title={"Site Management"}
                openAddModal={handleOpenAddModal}
                openViewModal={handleOpenViewModal}
              />
            </CCol>
          )}
          {(!isMobile || layoutView === LayoutView.Map) && (
            <CCol md={6} lg={7} xl={8}>
              <SiteMapView openViewModal={handleOpenViewModal} />
            </CCol>
          )}
        </CRow>
      </CCardBody>
      {isAddModalOpen &&
        <SiteAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      }
      {isDetailsModalOpen &&
        <SiteDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          siteId={siteId}
        />
      }
    </CCard>
  );
};

export default SiteManagement;
