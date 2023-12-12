import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import SiteDetailsModal from "../components/SiteDetailsModal";
import SiteAddModal from "../components/SiteAddModal";
import SiteEditModal from "../components/SiteEditModal";
import {
  siteGetAll,
  siteDeleteById,
  selectSiteList,
} from "redux/site/siteSlide";

const SiteManagement = () => {
  const siteList = useSelector(selectSiteList);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModelOpen, setIsEditModalOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [editingSiteId, setEditingSiteId] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(siteGetAll());
  }, [dispatch]);

  const handleSiteClick = (siteId) => {
    setSelectedSiteId(siteId);
    setIsDetailsModalOpen(true);
  };

  const handleEditSite = (event, siteId) => {
    setEditingSiteId(siteId);
    setIsEditModalOpen(true);
    event.stopPropagation();
  };

  const handleDeleteSite = (e, siteId) => {
    dispatch(siteDeleteById(siteId));
    e.stopPropagation();
  };

  return (
    <CCard>
      <CCardBody>
        <CCardTitle className="mb-3">
          Sites
          <CButton
            className="float-end mx-5"
            variant="outline"
            color="info"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Site
          </CButton>
        </CCardTitle>
        <CListGroup>
          {siteList.map(({ id, name }) => (
            <CListGroupItem
              key={id}
              className="d-flex justify-content-between align-items-center py-3"
              onClick={() => handleSiteClick(id)}
            >
              <div>
                <span>ID: {id}</span>
              </div>
              <span>{name}</span>
              <div>
                <CButton
                  className="mx-1"
                  variant="outline"
                  color="warning"
                  onClick={(e) => handleEditSite(e, id)}
                >
                  Edit
                </CButton>
                <CButton
                  className="mx-1"
                  variant="outline"
                  color="danger"
                  onClick={(e) => handleDeleteSite(e, id)}
                >
                  Delete
                </CButton>
              </div>
            </CListGroupItem>
          ))}
        </CListGroup>
      </CCardBody>

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
          siteId={selectedSiteId}
        />
      }
      {isEditModelOpen && (
        <SiteEditModal
          isOpen={isEditModelOpen}
          onClose={() => setIsEditModalOpen(false)}
          siteId={editingSiteId}
        />
      )}
    </CCard>
  );
};

export default SiteManagement;
