import {
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";
import { Search } from "@mui/icons-material";

import { getStationList } from "api/stations";
import StickyContainer from "components/StickyContainer";
import LoadingIndicator from "components/LoadingIndicator";
import useTypeInput from "hooks/useTypeInput";
import useWindowResize from "hooks/useWindowResize";
import { LayoutContext } from "contexts";

const StationList = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const ListLimit = 50;
  const listRef = useRef({});

  const { headerHeight, footerHeight } = useContext(LayoutContext);

  const [titleHeight, setTitleHeight] = useState(0);
  const titleRef = useCallback((node) => {
    setTitleHeight(node?.getBoundingClientRect().height);
  }, []);

  const [listHeight, setListHeight] = useState(0);
  useWindowResize(() => {
    setListHeight(window.innerHeight - headerHeight - titleHeight - footerHeight);
  });

  const [
    searchInput,
    setSearchInput,
    searchTerm,
  ] = useTypeInput(searchParams.get("search") || "", { delay: 350 });

  const [stationList, setStationList] = useState([]);
  const [listCursor, setListCursor] = useState({});
  const [loadingOnLoad, setLoadingOnLoad] = useState(false);
  const [loadingOnScroll, setLoadingOnScroll] = useState(false);

  useEffect(() => {
    setSearchParams((searchParams) => {
      if (searchTerm) {
        searchParams.set("search", searchTerm);
      } else {
        searchParams.delete("search");
      }
      return searchParams;
    });
  }, [searchTerm, setSearchParams]);

  const fetchOnLoad = useCallback(async () => {
    setLoadingOnLoad(true);
    const { stations, cursor } = await getStationList({
      fields: "name,street_address,city",
      search: searchTerm,
      sortBy: "-search_score",
      limit: ListLimit,
    });
    setStationList(stations);
    setListCursor(cursor);
    setLoadingOnLoad(false);
  }, [searchTerm]);

  const fetchOnScroll = useCallback(async () => {
    setLoadingOnScroll(true);
    const { stations, cursor } = await getStationList({
      fields: "name,street_address,city",
      search: searchTerm,
      sortBy: "-search_score",
      limit: ListLimit,
      cursor: listCursor.next,
    });
    setStationList((stationList) => [...stationList, ...stations]);
    setListCursor(cursor);
    setLoadingOnScroll(false);
  }, [searchTerm, listCursor.next]);

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

  return (
    <div className="d-flex flex-column h-100">
      <StickyContainer ref={titleRef} style={{ top: `${headerHeight}px` }}>
        <h5
          className="px-3 py-2 m-0 shadow-sm"
          style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
        >
          <CInputGroup className="w-auto">
            <CInputGroupText className="border border-primary">
              <Search color={`${searchInput ? "primary" : ""}`} />
            </CInputGroupText>
            <CFormInput
              type="text"
              name="search"
              placeholder="Search by name, street address, or city"
              className="border border-primary shadow-none"
              value={searchInput}
              onChange={({ target }) => setSearchInput(target.value)}
            />
          </CInputGroup>
        </h5>
      </StickyContainer>
      {loadingOnLoad
        ? <LoadingIndicator loading={loadingOnLoad} />
        : (
          <CListGroup
            ref={listRef}
            className="overflow-auto p-3"
            style={{ height: `${listHeight}px` }}
          >
            {stationList.length > 0
              ? (
                <>
                  {
                    stationList.map(({ id, name, street_address, city }) => {
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
                            {street_address}, {city}
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
              )
              : (
                <div className="d-flex flex-grow-1 justify-content-center align-items-center">
                  <span className="text-secondary">No stations found</span>
                </div>
              )
            }
          </CListGroup>
        )
      }
    </div>
  );
};

export default StationList;

