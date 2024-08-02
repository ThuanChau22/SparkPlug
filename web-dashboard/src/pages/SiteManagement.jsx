import { useCallback, useState, useEffect, useMemo, createRef } from "react";
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

import { siteIcon } from "assets/mapIcons";
import LoadingIndicator from "components/LoadingIndicator";
import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import SiteMarker from "components/SiteMarker";
import StickyContainer from "components/StickyContainer";
import SiteAddModal from "components/SiteManagement/AddModal";
import SiteDetailsModal from "components/SiteManagement/DetailsModal";
import { selectHeaderHeight } from "redux/header/headerSlice";
import {
  siteGetList,
  siteSetStateSelected,
  siteSetCitySelected,
  siteSetZipCodeSelected,
  selectSiteList,
  selectSelectedState,
  selectStateOptions,
  selectSelectedCity,
  selectCityOptions,
  selectSelectedZipCode,
  selectZipCodeOptions,
} from "redux/site/siteSlide";

const SiteManagement = () => {
  const filterRef = createRef();

  const headerHeight = useSelector(selectHeaderHeight);
  const siteList = useSelector(selectSiteList);
  const siteSelectedState = useSelector(selectSelectedState);
  const siteStateOptions = useSelector(selectStateOptions);
  const siteSelectedCity = useSelector(selectSelectedCity);
  const siteCityOptions = useSelector(selectCityOptions);
  const siteSelectedZipCode = useSelector(selectSelectedZipCode);
  const siteZipCodeOptions = useSelector(selectZipCodeOptions);

  const [loading, setLoading] = useState(false);

  const [mapHeight, setMapHeight] = useState(window.innerHeight);
  const [isMount, setIsMount] = useState(true);
  const [numberOfStations, setNumberOfSites] = useState(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [siteId, setSiteId] = useState(null);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    setIsMount(false);
    setNumberOfSites(siteList.length);
    if (siteList.length === 0) {
      setLoading(true);
      await dispatch(siteGetList()).unwrap();
      setLoading(false);
    }
  }, [siteList, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewSite = (siteId) => {
    setSiteId(siteId);
    setIsDetailsModalOpen(true);
  };

  const handleFilter = (state, city, zipCode) => {
    const params = [];
    if (state !== "All") params.push(`state=${state}`);
    if (city !== "All") params.push(`city=${city}`);
    if (zipCode !== "All") params.push(`zip_code=${zipCode}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    dispatch(siteGetList(query));
    dispatch(siteSetStateSelected(state));
    dispatch(siteSetCitySelected(city));
    dispatch(siteSetZipCodeSelected(zipCode));
  };

  useEffect(() => {
    const filterHeight = filterRef.current.offsetHeight;
    setMapHeight(window.innerHeight - (headerHeight + filterHeight));
  }, [headerHeight, filterRef]);

  const displayMap = useMemo(() => {
    const renderSiteMarker = (site) => (
      <SiteMarker
        key={site.id}
        site={site}
        icon={siteIcon}
        onSiteClick={handleViewSite}
      />
    );
    return (
      <div style={{ height: `${mapHeight}px` }}>
        <MapContainer
          locations={siteList}
          renderMarker={renderSiteMarker}
          setBound={isMount || numberOfStations !== siteList.length}
        />
      </div>
    );
  }, [siteList, mapHeight, isMount, numberOfStations]);

  return (
    <CCard className="flex-grow-1 border border-top-0 rounded-0">
      <CRow xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="d-flex flex-column h-100 pt-0">
            <StickyContainer
              className="bg-white py-3"
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
                      component="button"
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
        <CCol md={6} lg={7}>
          <StickyContainer top={`${headerHeight}px`}>
            <LocationFilter
              ref={filterRef}
              selectedState={siteSelectedState}
              states={siteStateOptions}
              selectedCity={siteSelectedCity}
              cities={siteCityOptions}
              selectedZipCode={siteSelectedZipCode}
              zipCodes={siteZipCodeOptions}
              onChange={handleFilter}
            />
            {displayMap}
          </StickyContainer>
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
