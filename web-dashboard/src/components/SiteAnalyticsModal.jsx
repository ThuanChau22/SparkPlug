import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { GooeyCircleLoader } from "react-loaders-kit";
import { CChart } from "@coreui/react-chartjs";
import {
  CContainer,
  CForm,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from "@coreui/react";

import { apiInstance } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import { selectSiteById } from "redux/site/siteSlide";

const SiteAnalyticsModal = ({ isOpen, onClose, siteId }) => {
  const SiteAnalyticsAPI = process.env.REACT_APP_SITE_ANALYTICS_API_ENDPOINT;
  const site = useSelector((state) => selectSiteById(state, siteId));
  const token = useSelector(selectAuthAccessToken);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chargeLevel, setChargeLevel] = useState("All");

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    let month = "" + (date.getMonth() + 1);
    let day = "" + date.getDate();
    const year = date.getFullYear();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [month, day, year].join("/");
  };

  const fetchData = useCallback(async () => {
    try {
      const base = `${SiteAnalyticsAPI}/${siteId}`;
      const params = [];
      if (startDate) params.push(`start_date=${formatDate(startDate)}`);
      if (endDate) params.push(`end_date=${formatDate(endDate)}`);
      if (chargeLevel !== "All") params.push(`charge_level=${chargeLevel}`);
      const query = params.length > 0 ? `?${params.join("&")}` : "";
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await apiInstance.get(`${base}${query}`, { headers });
      setAnalyticsData(data);
    } catch (error) {
      console.log(error);
    }
  }, [SiteAnalyticsAPI, siteId, token, startDate, endDate, chargeLevel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <CModal
      size="xl"
      alignment="center"
      visible={isOpen}
      onClose={onClose}
      scrollable
    >
      <CModalHeader className="mb-2">
        <CModalTitle>{site.name}</CModalTitle>
      </CModalHeader>
      <p className="ps-3" >Site ID: {site.id}</p>
      <CForm className="d-flex align-item-center">
        <CInputGroup>
          <CInputGroupText className="bg-secondary text-white rounded-0">
            From
          </CInputGroupText>
          <CFormInput
            className="rounded-0 shadow-none"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </CInputGroup>
        <CInputGroup>
          <CInputGroupText className="bg-secondary text-white rounded-0">
            To
          </CInputGroupText>
          <CFormInput
            className="rounded-0 shadow-none"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </CInputGroup>
        <CInputGroup>
          <CInputGroupText className="bg-secondary text-white rounded-0">
            Charge Level
          </CInputGroupText>
          <CFormSelect
            className="rounded-0 shadow-none"
            options={[
              { label: "All Levels", value: "All" },
              { label: "Level 1", value: "1" },
              { label: "Level 2", value: "2" },
              { label: "Level 3", value: "3" },
            ]}
            value={chargeLevel}
            onChange={(e) => setChargeLevel(e.target.value)}
          />
        </CInputGroup>
      </CForm>
      <CModalBody>
        {analyticsData
          ? (
            <>
              <CChart type="line" data={analyticsData.revenue} />
              <CChart type="bar" data={analyticsData.peak_time} />
              <CChart type="line" data={analyticsData.utilization_rate} />
              <CChart type="bar" data={analyticsData.sessions_count} />
            </>
          )
          : (
            <CContainer className="d-flex flex-row justify-content-center">
              <GooeyCircleLoader
                className="mx-auto"
                color={["#f6b93b", "#5e22f0", "#ef5777"]}
                loading={true}
              />
            </CContainer>
          )}
      </CModalBody>
    </CModal>
  );
};

export default SiteAnalyticsModal;
