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
  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);

  const siteList = useSelector(selectSiteList);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [siteId, setSiteId] = useState(null);

  const dispatch = useDispatch();

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
          <CCol md={6} lg={5} xl={4}>
            <SiteListView
              title={"Site Management"}
              openAddModal={handleOpenAddModal}
              openViewModal={handleOpenViewModal}
            />
          </CCol>
          <CCol md={6} lg={7} xl={8}>
            <SiteMapView openViewModal={handleOpenViewModal} />
          </CCol>
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
