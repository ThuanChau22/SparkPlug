import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import {
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import useFetchData from "hooks/useFetchData";
import useFetchDataOnMapView from "hooks/useFetchDataOnMapView";
import useFetchDataOnScroll from "hooks/useFetchDataOnScroll";
import useMapParams from "hooks/useMapParams";
import useWindowResize from "hooks/useWindowResize";
import {
  selectMapLowerBound,
  selectMapUpperBound,
} from "redux/map/mapSlice";
import {
  SiteFields,
  siteGetList,
  selectSiteListByFields,
} from "redux/site/siteSlice";
import utils from "utils";

const SiteListView = ({ refHeight, handleViewSite }) => {
  const SiteListLimit = 50;
  const listRef = useRef({});

  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);
  const siteSelectedFields = useMemo(() => ([
    SiteFields.name,
    SiteFields.streetAddress,
    SiteFields.city,
  ]), []);
  const siteList = useSelector((state) => {
    return selectSiteListByFields(state, siteSelectedFields);
  });

  const [page, setPage] = useState(0);
  const [siteCursor, setSiteCursor] = useState({});

  const [mapParams] = useMapParams();

  const { latLngMin, latLngMax } = useMemo(() => {
    const latLngMin = utils.toLatLngString(mapLowerBound);
    const latLngMax = utils.toLatLngString(mapUpperBound);
    return { latLngMin, latLngMax };
  }, [mapLowerBound, mapUpperBound]);

  const siteListByPage = useMemo(() => (
    siteList.filter((_, index) => index < SiteListLimit * page)
  ), [siteList, SiteListLimit, page]);

  const fetchOnLoad = useMemo(() => (
    !mapParams.exist && !latLngMin && !latLngMax
  ), [latLngMin, latLngMax, mapParams]);

  const { data, loadState } = useFetchData({
    condition: fetchOnLoad,
    action: useCallback(() => siteGetList({
      fields: siteSelectedFields.join(),
      latLngOrigin: "default",
      limit: SiteListLimit,
    }), [siteSelectedFields]),
  });

  const {
    data: dataOnMapView,
    loadState: loadStateOnMapView,
  } = useFetchDataOnMapView({
    condition: !loadState.loading,
    action: useCallback(() => siteGetList({
      fields: siteSelectedFields.join(),
      latLngMin, latLngMax,
      limit: SiteListLimit,
    }), [siteSelectedFields, latLngMin, latLngMax]),
  });

  const {
    data: dataOnScroll,
    loadState: loadStateOnScroll,
  } = useFetchDataOnScroll({
    action: useCallback(() => siteGetList({
      latLngMin, latLngMax,
      limit: SiteListLimit,
      cursor: siteCursor.next,
    }), [latLngMin, latLngMax, siteCursor.next]),
    ref: listRef,
    cursor: siteCursor,
  });

  const [listHeight, setListHeight] = useState(0);
  useWindowResize(() => {
    setListHeight(window.innerHeight - refHeight);
  });

  const loading = useMemo(() => (
    loadState.loading || (loadState.idle && loadStateOnMapView.loading)
  ), [loadState, loadStateOnMapView]);

  useEffect(() => {
    if (loadState.idle && loadStateOnMapView.done) {
      loadState.setDone();
    }
  }, [loadState, loadStateOnMapView]);

  useEffect(() => {
    if (data && loadState.done) {
      setSiteCursor(data.cursor);
      setPage(1);
    }
  }, [data, loadState]);

  useEffect(() => {
    if (dataOnMapView && loadStateOnMapView.done) {
      listRef.current.scrollTop = 0;
      setSiteCursor(dataOnMapView.cursor);
      setPage(1);
    }
  }, [dataOnMapView, loadStateOnMapView]);

  useEffect(() => {
    if (dataOnScroll && loadStateOnScroll.done) {
      setSiteCursor(dataOnScroll.cursor);
      setPage((state) => state + 1);
    }
  }, [dataOnScroll, loadStateOnScroll]);

  return (loading
    ? <LoadingIndicator loading={loading} />
    : (
      <CListGroup
        ref={listRef}
        className="overflow-auto px-3 pb-3"
        style={{ height: `${listHeight}px` }}
      >
        {
          siteListByPage.map(({ id, name, street_address, city }) => (
            <CListGroupItem
              key={id}
              className="border rounded py-3 my-1 shadow-sm"
              as="button"
              onClick={() => handleViewSite(id)}
            >
              <p className="mb-0 text-secondary">
                {`ID: ${id}`}
              </p>
              <p className="mb-0 text-secondary small">
                {street_address}, {city}
              </p>
              <p className="mb-0">{name}</p>
            </CListGroupItem>
          ))}
        {loadStateOnScroll.loading && (
          <LoadingIndicator loading={loadStateOnScroll.loading} />
        )}
      </CListGroup>
    )
  );
};

export default SiteListView;
