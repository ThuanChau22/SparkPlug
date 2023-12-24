import { useCallback, useState, useEffect, createRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GooeyCircleLoader } from "react-loaders-kit";
import {
  CContainer,
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import StickyContainer from "components/StickyContainer";
import { selectHeaderHeight } from "redux/header/headerSlice";
import UserDetailsModal from "components/UserDetailsModal";
import {
  userGetAll,
  selectUserList,
} from "redux/user/userSlide";

const UserManagement = () => {
  const titleRef = createRef();
  const headerHeight = useSelector(selectHeaderHeight);
  const userList = useSelector(selectUserList);
  const [listHeight, setListHeight] = useState(window.innerHeight);
  const [loading, setLoading] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const titleHeight = titleRef.current.offsetHeight;
    setListHeight(window.innerHeight - (headerHeight + titleHeight));
  }, [headerHeight, titleRef]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (userList.length === 0) {
      await dispatch(userGetAll()).unwrap();
    }
    setLoading(false);
  }, [userList, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewUser = (userId) => {
    setSelectedUserId(userId);
    setIsDetailsModalOpen(true);
  };

  return (
    <CCard className="border border-top-0 rounded-0">
      <CCardBody className="pt-0">
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
                        status === "Active"
                          ? "text-success"
                          : status === "Blocked"
                            ? "text-warning"
                            : "text-danger"
                      }>
                      {status}
                    </span>
                  </p>
                </CListGroupItem>
              ))}
            </CListGroup>
          )}
      </CCardBody>
      {
        isDetailsModalOpen && (
          <UserDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            userId={selectedUserId}
          />
        )
      }
    </CCard >
  );
};

export default UserManagement;
