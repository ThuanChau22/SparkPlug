import { useCallback, useState, useEffect, useMemo, createRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GooeyCircleLoader } from "react-loaders-kit";
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import { siteIcon } from "assets/mapIcons";
import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import SiteAnalyticsModal from "components/SiteAnalyticsModal";
import SiteMarker from "components/SiteMarker";
import StickyContainer from "components/StickyContainer";
import { selectHeaderHeight } from "redux/header/headerSlice";
import {
  siteGetAll,
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

const SiteAnalytics = () => {
  const titleRef = createRef();
  const filterRef = createRef();
  const headerHeight = useSelector(selectHeaderHeight);
  const siteList = useSelector(selectSiteList);
  const siteSelectedState = useSelector(selectSelectedState);
  const siteStateOptions = useSelector(selectStateOptions);
  const siteSelectedCity = useSelector(selectSelectedCity);
  const siteCityOptions = useSelector(selectCityOptions);
  const siteSelectedZipCode = useSelector(selectSelectedZipCode);
  const siteZipCodeOptions = useSelector(selectZipCodeOptions);
  const [listHeight, setListHeight] = useState(window.innerHeight);
  const [mapHeight, setMapHeight] = useState(window.innerHeight);
  const [loading, setLoading] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const titleHeight = titleRef.current.offsetHeight;
    setListHeight(window.innerHeight - (headerHeight + titleHeight));
  }, [headerHeight, titleRef]);

  useEffect(() => {
    const filterHeight = filterRef.current.offsetHeight;
    setMapHeight(window.innerHeight - (headerHeight + filterHeight));
  }, [headerHeight, filterRef]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (siteList.length === 0) {
      await dispatch(siteGetAll()).unwrap();
    }
    setLoading(false);
  }, [siteList, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = (state, city, zipCode) => {
    const params = [];
    if (state !== "All") params.push(`state=${state}`);
    if (city !== "All") params.push(`city=${city}`);
    if (zipCode !== "All") params.push(`zip_code=${zipCode}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    dispatch(siteGetAll(query));
    dispatch(siteSetStateSelected(state));
    dispatch(siteSetCitySelected(city));
    dispatch(siteSetZipCodeSelected(zipCode));
  };

  const handleViewSite = (siteId) => {
    setSelectedSiteId(siteId);
    setIsAnalyticsModalOpen(true);
  };

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
        />
      </div>
    );
  }, [siteList, mapHeight]);

  return (
    <CCard className="border border-top-0 rounded-0">
      <CRow xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="pt-0">
            <StickyContainer
              ref={titleRef}
              className="bg-white py-3"
              top={`${headerHeight}px`}
            >
              <CCardTitle>
                Sites Analytics
              </CCardTitle>
            </StickyContainer>
            {loading
              ? (
                <div
                  className="d-flex align-items-center"
                  style={{ height: `${listHeight}px` }}
                >
                  <CContainer className="d-flex flex-row justify-content-center">
                    <GooeyCircleLoader
                      color={["#f6b93b", "#5e22f0", "#ef5777"]}
                      loading={true}
                    />
                  </CContainer>
                </div>
              )
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
              )}
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
      {
        isAnalyticsModalOpen && (
          <SiteAnalyticsModal
            isOpen={isAnalyticsModalOpen}
            onClose={() => setIsAnalyticsModalOpen(false)}
            siteId={selectedSiteId}
          />
        )
      }
    </CCard >
  );
};

export default SiteAnalytics;
