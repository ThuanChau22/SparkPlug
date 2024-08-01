import { useCallback, useState, useEffect, createRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import StickyContainer from "components/StickyContainer";
import UserDetailsModal from "components/UserManagement/DetailsModal";
import { selectHeaderHeight } from "redux/header/headerSlice";
import {
  userGetList,
  selectUserList,
  selectUserCursor,
} from "redux/user/userSlide";

const UserManagement = () => {
  const userLoadLimit = 100;
  const titleRef = createRef();
  const listRef = createRef();

  const headerHeight = useSelector(selectHeaderHeight);
  const userList = useSelector(selectUserList);
  const userCursor = useSelector(selectUserCursor);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [userId, setUserId] = useState(null);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (userList.length === 0) {
      await dispatch(userGetList({
        limit: userLoadLimit
      })).unwrap();
    }
    setLoading(false);
  }, [userList, dispatch]);

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
      <CCardBody className="d-flex flex-column h-100 pt-0">
        <StickyContainer
          ref={titleRef}
          className="bg-white py-3"
          top={`${headerHeight}px`}
        >
          <CCardTitle>
            Users Management
          </CCardTitle>
        </StickyContainer>
        {loading
          ? <LoadingIndicator loading={loading} />
          : (
            <>
              <CListGroup ref={listRef}>
                {userList.map(({ id, name, email, status }) => (
                  <CListGroupItem
                    key={id}
                    className="align-items-center py-3"
                    component="button"
                    onClick={() => handleViewUser(id)}
                  >
                    <p className="d-flex justify-content-between mb-0">
                      <small className="w-100 text-secondary">ID: {id}</small>
                      <span>Status</span>
                    </p>
                    <p className="d-flex justify-content-between mb-0">
                      <span>Name: {name}</span>
                      <span>Email: {email}</span>
                      <span
                        className={
                          status === "active"
                            ? "text-success"
                            : status === "terminated"
                              ? "text-danger"
                              : "text-warning"
                        }>
                        {status}
                      </span>
                    </p>
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
