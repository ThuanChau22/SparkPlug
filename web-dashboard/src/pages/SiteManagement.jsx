import { useCallback, useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CRow,
  CCol,
  CCard,
  CCardTitle,
  CCardBody,
} from "@coreui/react";

import StickyContainer from "components/StickyContainer";
import SiteAddModal from "components/SiteManagement/AddModal";
import SiteDetailsModal from "components/SiteManagement/DetailsModal";
import SiteListView from "components/SiteManagement/ListView";
import SiteMapView from "components/SiteManagement/MapView";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import {
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
  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);
  const siteList = useSelector(selectSiteList);

  const [titleHeight, setTitleHeight] = useState(0);
  const titleRef = useCallback((node) => {
    setTitleHeight(node?.getBoundingClientRect().height);
  }, []);

  const listRefHeight = useMemo(() => {
    return headerHeight + titleHeight;
  }, [headerHeight, titleHeight]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [siteId, setSiteId] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    const hasLowerBound = utils.hasLatLngValue(mapLowerBound);
    const hasUpperBound = utils.hasLatLngValue(mapUpperBound);
    if (hasLowerBound && hasUpperBound) {
      const { lat: latMin, lng: lngMin } = mapLowerBound;
      const { lat: latMax, lng: lngMax } = mapUpperBound;
      const siteIds = siteList.filter(({ latitude, longitude }) => {
        const isNotLowerBound = latitude < latMin || longitude < lngMin;
        const isNotUpperBound = latitude > latMax || longitude > lngMax;
        return isNotLowerBound || isNotUpperBound;
      }).map(({ id }) => id);
      dispatch(siteStateDeleteMany(siteIds));
    }
  }, [siteList, mapLowerBound, mapUpperBound, dispatch]);

  useEffect(() => () => dispatch(siteStateClear()), [dispatch]);

  const handleViewSite = (siteId) => {
    setSiteId(siteId);
    setIsDetailsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CRow className="flex-grow-1" xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="d-flex flex-column h-100 p-0">
            <StickyContainer ref={titleRef} style={{ top: `${headerHeight}px` }}>
              <CCardTitle
                className="d-flex justify-content-between align-items-center px-3 py-2 shadow-sm"
                style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
              >
                Sites Management
                <CButton
                  variant="outline"
                  color="info"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Add Site
                </CButton>
              </CCardTitle>
            </StickyContainer>
            <SiteListView
              refHeight={listRefHeight}
              handleViewSite={handleViewSite}
            />
          </CCardBody>
        </CCol>
        <CCol md={6} lg={7}>
          <SiteMapView handleViewSite={handleViewSite} />
        </CCol>
      </CRow>
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
