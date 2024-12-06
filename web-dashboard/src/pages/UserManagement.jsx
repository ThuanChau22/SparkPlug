import { useCallback, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
  CRow,
  CCol,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import StickyContainer from "components/StickyContainer";
import UserActiveStatus from "components/UserManagement/ActiveStatus";
import UserDetailsModal from "components/UserManagement/DetailsModal";
import useFetchData from "hooks/useFetchData";
import useFetchDataOnScroll from "hooks/useFetchDataOnScroll";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import {
  userStateClear,
  userGetList,
  selectUserList,
} from "redux/user/userSlice";

const UserManagement = () => {
  const UserLoadLimit = 100;

  const headerHeight = useSelector(selectLayoutHeaderHeight);
  const userList = useSelector(selectUserList);

  const [isFetched, setIsFetched] = useState(false);
  const [userCursor, setUserCursor] = useState({});

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [userId, setUserId] = useState(null);

  const dispatch = useDispatch();

  const [titleHeight, setTitleHeight] = useState(0);
  const titleRef = useCallback((node) => {
    setTitleHeight(node?.getBoundingClientRect().height);
  }, []);
  const listRef = useRef({});

  const { data, loadState } = useFetchData({
    condition: !isFetched,
    action: useCallback(() => userGetList({ limit: UserLoadLimit }), []),
  });

  const {
    data: dataOnScroll,
    loadState: loadStateOnScroll,
  } = useFetchDataOnScroll({
    isWindow: true,
    action: useCallback(() => userGetList({
      limit: UserLoadLimit,
      cursor: userCursor.next,
    }), [userCursor.next]),
    ref: listRef,
    cursor: userCursor,
    refHeight: headerHeight + titleHeight,
  });

  useEffect(() => {
    if (loadState.done) {
      setIsFetched(true);
    }
  }, [loadState]);

  useEffect(() => {
    if (data && loadState.done) {
      setUserCursor(data.cursor);
    }
  }, [data, loadState]);

  useEffect(() => {
    if (dataOnScroll && loadStateOnScroll.done) {
      setUserCursor(dataOnScroll.cursor);
    }
  }, [dataOnScroll, loadStateOnScroll]);

  useEffect(() => () => dispatch(userStateClear()), [dispatch]);

  const handleViewUser = (userId) => {
    setUserId(userId);
    setIsDetailsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CCardBody className="d-flex flex-column h-100 p-0 pb-3">
        <StickyContainer ref={titleRef} style={{ top: `${headerHeight}px` }}>
          <CCardTitle
            className="p-3 shadow-sm"
            style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
          >
            Users Management
          </CCardTitle>
        </StickyContainer>
        {loadState.loading
          ? <LoadingIndicator loading={loadState.loading} />
          : (
            <CListGroup ref={listRef} className="px-3">
              {userList.map(({ id, name, email, status }) => (
                <CListGroupItem
                  key={id}
                  className="border rounded py-3 my-1 shadow-sm"
                  as="button"
                  onClick={() => handleViewUser(id)}
                >
                  <p className="d-flex justify-content-between mb-0">
                    <small className="w-100 text-secondary">ID: {id}</small>
                    <span>Status</span>
                  </p>
                  <CRow>
                    <CCol>
                      <CRow>
                        <CCol xs={12} sm={6} className="pe-0">
                          Name: {name}
                        </CCol>
                        <CCol xs={12} sm={6} className="pe-0">
                          Email: {email}
                        </CCol>
                      </CRow>
                    </CCol>
                    <CCol xs="auto" sm={3} className="ps-0 text-end">
                      <UserActiveStatus status={status} />
                    </CCol>
                  </CRow>
                </CListGroupItem>
              ))}
              {loadStateOnScroll.loading && (
                <LoadingIndicator loading={loadStateOnScroll.loading} />
              )}
            </CListGroup>
          )}
      </CCardBody>
      {isDetailsModalOpen && (
        <UserDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          userId={userId}
        />
      )}
    </CCard >
  );
};

export default UserManagement;
