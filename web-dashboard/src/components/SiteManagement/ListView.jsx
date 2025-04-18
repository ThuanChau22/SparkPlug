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
  const ListLimit = 50;
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

  const [listPage, setListPage] = useState(0);
  const [listCursor, setListCursor] = useState({});

  const [listHeight, setListHeight] = useState(0);
  useWindowResize(useCallback(() => {
    setListHeight(window.innerHeight - refHeight);
  }, [refHeight]));

  const { latLngMin, latLngMax } = useMemo(() => {
    const latLngMin = utils.toLatLngString(mapLowerBound);
    const latLngMax = utils.toLatLngString(mapUpperBound);
    return { latLngMin, latLngMax };
  }, [mapLowerBound, mapUpperBound]);

  const siteListByPage = useMemo(() => (
    siteList.filter((_, index) => index < ListLimit * listPage)
  ), [siteList, listPage]);

  const [mapParams] = useMapParams();

  const fetchOnLoad = useMemo(() => (
    !mapParams.exist && !latLngMin && !latLngMax
  ), [latLngMin, latLngMax, mapParams]);

  const { data, loadState } = useFetchData({
    condition: fetchOnLoad,
    action: useCallback(() => siteGetList({
      fields: siteSelectedFields.join(),
      latLngOrigin: "default",
      limit: ListLimit,
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
      limit: ListLimit,
    }), [siteSelectedFields, latLngMin, latLngMax]),
  });

  const {
    data: dataOnScroll,
    loadState: loadStateOnScroll,
  } = useFetchDataOnScroll({
    action: useCallback(() => siteGetList({
      fields: siteSelectedFields.join(),
      latLngMin, latLngMax,
      limit: ListLimit,
      cursor: listCursor.next,
    }), [siteSelectedFields, latLngMin, latLngMax, listCursor.next]),
    ref: listRef,
    cursor: listCursor,
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
      setListCursor(data.cursor);
      setListPage(1);
    }
  }, [data, loadState]);

  useEffect(() => {
    if (dataOnMapView && loadStateOnMapView.done) {
      setListCursor(dataOnMapView.cursor);
      setListPage(1);
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    }
  }, [dataOnMapView, loadStateOnMapView]);

  useEffect(() => {
    if (dataOnScroll && loadStateOnScroll.done) {
      setListCursor(dataOnScroll.cursor);
      setListPage((state) => state + 1);
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
        {siteListByPage.length > 0
          ? (
            <>
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
            </>
          )
          : (
            <div className="d-flex flex-grow-1 justify-content-center align-items-center">
              <span className="text-secondary">No sites found</span>
            </div>
          )
        }

      </CListGroup>
    )
  );
};

export default SiteListView;
