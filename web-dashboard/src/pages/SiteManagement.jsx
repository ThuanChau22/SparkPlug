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
import SiteAddModal from "components/SiteManagement/AddModal";
import SiteDetailsModal from "components/SiteManagement/DetailsModal";
import SiteMapView from "components/SiteManagement/MapView";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import {
  siteGetList,
  selectSiteList,
} from "redux/site/siteSlice";

const SiteManagement = () => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);
  const siteList = useSelector(selectSiteList);

  const [loading, setLoading] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [siteId, setSiteId] = useState(null);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (siteList.length === 0) {
      setLoading(true);
      await dispatch(siteGetList()).unwrap();
      setLoading(false);
    }
  }, [siteList.length, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewSite = (siteId) => {
    setSiteId(siteId);
    setIsDetailsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-top-0 rounded-0">
      <CRow xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="d-flex flex-column h-100 pt-0">
            <StickyContainer
              className="py-3" // TODO: Change background color
              top={`${headerHeight}px`}
            >
              <CCardTitle className="d-flex flex-row justify-content-between align-items-center">
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
            {loading
              ? <LoadingIndicator loading={loading} />
              : (
                <CListGroup>
                  {siteList.map(({ id, name }) => (
                    <CListGroupItem
                      key={id}
                      className="py-3"
                      as="button"
                      onClick={() => handleViewSite(id)}
                    >
                      <small className="w-100 text-secondary">ID: {id}</small>
                      <p className="mb-0">{name}</p>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              )
            }
          </CCardBody>
        </CCol>
        <CCol md={6} lg={7} style={{ position: 'relative', zIndex: 500 }}>
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
    </CCard >
  );
};

export default SiteManagement;
