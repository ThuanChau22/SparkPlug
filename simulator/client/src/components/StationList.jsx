import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import { getLocationAutocomplete } from "api/sites";
import { getStationList } from "api/stations";
import Demo from "components/Demo";
import StickyContainer from "components/StickyContainer";
import LoadingIndicator from "components/LoadingIndicator";
import SearchBar from "components/SearchBar";
import useWindowResize from "hooks/useWindowResize";
import { LayoutContext, ToastContext } from "contexts";

const StationList = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = useMemo(() => searchParams.get("search"), [searchParams]);

  const ListLimit = 25;
  const listRef = useRef({});

  const { headerHeight, footerHeight } = useContext(LayoutContext);
  const { setToastMessage } = useContext(ToastContext);

  const selectedFields = "name,street_address,city,state,zip_code";

  const [stationList, setStationList] = useState([]);
  const [listCursor, setListCursor] = useState({});
  const [loadingOnLoad, setLoadingOnLoad] = useState(false);
  const [loadingOnScroll, setLoadingOnScroll] = useState(false);

  const fetchOnLoad = useCallback(async () => {
    setLoadingOnLoad(true);
    try {
      const { data, cursor } = await getStationList({
        fields: selectedFields,
        search: searchTerm,
        sortBy: "-search_score",
        limit: ListLimit,
      });
      setStationList(data);
      setListCursor(cursor);
    } catch (error) {
      setToastMessage({
        color: "danger",
        text: error.message,
      });
    }
    setLoadingOnLoad(false);
  }, [searchTerm, setToastMessage]);

  const fetchOnScroll = useCallback(async () => {
    setLoadingOnScroll(true);
    try {
      const { data, cursor } = await getStationList({
        fields: selectedFields,
        search: searchTerm,
        sortBy: "-search_score",
        limit: ListLimit,
        cursor: listCursor.next,
      });
      setStationList((stationList) => [...stationList, ...data]);
      setListCursor(cursor);
    } catch (error) {
      setToastMessage({
        color: "danger",
        text: error.message,
      });
    }
    setLoadingOnScroll(false);
  }, [searchTerm, listCursor.next, setToastMessage]);

  useEffect(() => {
    fetchOnLoad();
  }, [fetchOnLoad]);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, offsetHeight, scrollHeight } = listRef.current || {};
      const loadPosition = scrollHeight - offsetHeight;
      if (scrollTop >= loadPosition && listCursor.next && !loadingOnScroll) {
        fetchOnScroll();
      }
    };
    const current = listRef.current;
    if (listRef.current?.addEventListener) {
      listRef.current.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (current?.removeEventListener) {
        current?.removeEventListener("scroll", handleScroll);
      }
    };
  }, [listCursor.next, loadingOnScroll, fetchOnScroll]);

  const onSearchAutocomplete = async (input) => {
    const locations = await getLocationAutocomplete({
      name: input,
      streetAddress: input,
      city: input,
      state: input,
      zipCode: input,
      country: input,
      limit: 5,
    });
    return locations.map((location) => {
      const { name, street_address, city } = location;
      const { state, zip_code, country } = location;
      const label = [
        name, street_address, city,
        state, zip_code, country,
      ].filter((e) => e).join(", ");
      return { label, value: label }
    });
  };

  const onSearchSelected = ([selected]) => {
    setSearchParams((searchParams) => {
      if (selected) {
        searchParams.set("search", selected.value);
      } else {
        searchParams.delete("search");
      }
      return searchParams;
    });
  };

  useEffect(() => {
    const handleOnKeydown = ({ code }) => {
      if (code === "Escape") {
        navigate("/stations")
      }
    };
    document.addEventListener("keydown", handleOnKeydown);
    return () => {
      document.removeEventListener("keydown", handleOnKeydown);
    }
  });

  const [titleHeight, setTitleHeight] = useState(0);
  const titleRef = useCallback((node) => {
    setTitleHeight(node?.getBoundingClientRect().height);
  }, []);

  const [listHeight, setListHeight] = useState(0);
  useWindowResize(useCallback(() => {
    const refHeight = headerHeight + titleHeight + footerHeight;
    setListHeight(window.innerHeight - refHeight);
  }, [headerHeight, titleHeight, footerHeight]));

  return (
    <div ref={listRef} className="overflow-auto d-flex flex-column h-100">
      <StickyContainer ref={titleRef} style={{ top: "0px" }}>
        <h5
          className="px-3 py-2 m-0 shadow-sm"
          style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
        >
          <SearchBar
            id="location-input-autocomplete"
            placeholder="Search by name or location"
            value={searchTerm}
            onSearch={onSearchAutocomplete}
            onChange={onSearchSelected}
          />
        </h5>
      </StickyContainer>
      <div className="d-flex flex-column" style={{ height: `${listHeight}px` }}>
        {loadingOnLoad
          ? (<LoadingIndicator loading={loadingOnLoad} />)
          : (stationList.length > 0
            ? (
              <CListGroup className="px-3 pb-3">
                <>
                  <CListGroupItem className="border rounded py-3 my-1 shadow-sm">
                    <Demo search={searchTerm} />
                  </CListGroupItem>
                  {
                    stationList.map(({ id, name, street_address, city, state, zip_code }) => {
                      const isActive = `${id}` === params.stationId;
                      return (
                        <CListGroupItem
                          key={id}
                          className={`border rounded py-3 my-1 shadow-sm${isActive ? " border-primary" : ""}`}
                          as="button"
                          disabled={isActive}
                          onClick={() => navigate(`/stations/${id}`)}
                        >
                          <p className={`mb-0${isActive ? "" : " text-secondary"}`}>
                            {`ID: ${id}`}
                          </p>
                          <p className={`mb-0${isActive ? "" : " text-secondary"}`}>
                            {street_address}, {city}, {state} {zip_code}
                          </p>
                          <p className={`mb-0${isActive ? " text-primary" : ""}`}>
                            {name}
                          </p>
                        </CListGroupItem>
                      );
                    })
                  }
                  {loadingOnScroll && (
                    <LoadingIndicator loading={loadingOnScroll} />
                  )}
                </>
              </CListGroup>
            )
            : (
              <div className="d-flex flex-grow-1 justify-content-center align-items-center">
                <span className="text-secondary">No stations found</span>
              </div>
            )
          )
        }
      </div>
    </div>
  );
};

export default StationList;

