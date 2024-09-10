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
import {
  selectLayoutHeaderHeight,
} from "redux/layout/layoutSlice";
import {
  userGetList,
  selectUserList,
  selectUserCursor,
} from "redux/user/userSlice";

const UserManagement = () => {
  const userLoadLimit = 100;
  const titleRef = useRef({});
  const listRef = useRef({});

  const headerHeight = useSelector(selectLayoutHeaderHeight);
  const userList = useSelector(selectUserList);
  const userCursor = useSelector(selectUserCursor);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [userId, setUserId] = useState(null);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (userList.length === 0) {
      setLoading(true);
      await dispatch(userGetList({
        limit: userLoadLimit
      })).unwrap();
      setLoading(false);
    }
  }, [userList.length, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLoadMore = useCallback(async () => {
    const titleHeight = titleRef.current?.offsetHeight;
    const listHeight = listRef.current?.offsetHeight;
    const topHeight = headerHeight + titleHeight;
    const loadPosition = listHeight - window.innerHeight + topHeight;
    if (!loadingMore && userCursor.next && window.scrollY >= loadPosition) {
      setLoadingMore(true);
      await dispatch(userGetList({
        limit: userLoadLimit,
        cursor: userCursor.next,
      })).unwrap();
      setLoadingMore(false);
    }
  }, [loadingMore, userCursor, headerHeight, titleRef, listRef, dispatch]);

  useEffect(() => {
    window.addEventListener("scroll", handleLoadMore);
    return () => {
      window.removeEventListener("scroll", handleLoadMore);
    }
  }, [handleLoadMore]);

  const handleViewUser = (userId) => {
    setUserId(userId);
    setIsDetailsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-top-0 rounded-0">
      <CCardBody className="d-flex flex-column h-100 p-0 pb-3">
        <StickyContainer
          ref={titleRef}
          top={`${headerHeight}px`}
        >
          <CCardTitle
            className="p-3 shadow-sm"
            style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
          >
            Users Management
          </CCardTitle>
        </StickyContainer>
        {loading
          ? <LoadingIndicator loading={loading} />
          : (
            <>
              <CListGroup className="px-3" ref={listRef}>
                {userList.map(({ id, name, email, status }) => (
                  <CListGroupItem
                    key={id}
                    className="align-items-center py-3"
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
              </CListGroup>
              {loadingMore && (
                <LoadingIndicator loading={loadingMore} />
              )}
            </>
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
