import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { CChart } from "@coreui/react-chartjs";
import {
  CButton,
  CFormSelect,
  CModal,
  CModalBody,
} from "@coreui/react";

import { apiInstance } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import "../scss/SiteAnalyticsModal.scss";

const SiteAnalyticsModal = ({ isOpen, onClose, siteId }) => {
  const SITE_ANALYTICS_API_ENDPOINT = process.env.REACT_APP_SITE_ANALYTICS_API_ENDPOINT
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

  const fetchData = async () => {
    if (siteId) {
      try {
        let query = `${SITE_ANALYTICS_API_ENDPOINT}/${siteId}`;
        let queryParams = [];
        if (startDate) queryParams.push(`start_date=${formatDate(startDate)}`);
        if (endDate) queryParams.push(`end_date=${formatDate(endDate)}`);
        if (chargeLevel !== "All") queryParams.push(`charge_level=${chargeLevel}`);
        if (queryParams.length > 0) query += "?" + queryParams.join("&");
        const headers = { Authorization: `Bearer ${token}` };
        const { data } = await apiInstance.get(query, { headers });
        setAnalyticsData(data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [siteId]);

  return (
    <CModal
      alignment="center"
      visible={isOpen}
      onClose={onClose}
    >
      <CModalBody>
        <div className="analytics-filters">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <CFormSelect
            className="shadow-none"
            options={[
              { label: "All Levels", value: "All" },
              { label: "Level 1", value: "1" },
              { label: "Level 2", value: "2" },
              { label: "Level 3", value: "3" },
            ]}
            value={chargeLevel}
            onChange={(e) => setChargeLevel(e.target.value)}
          />
          <CButton onClick={fetchData}>Update</CButton>
        </div>
        {analyticsData && (
          <>
            <CChart type="line" data={analyticsData.revenue} options={{}} />
            <CChart type="bar" data={analyticsData.peak_time} options={{}} />
            <CChart type="line" data={analyticsData.utilization_rate} options={{}} />
            <CChart type="bar" data={analyticsData.sessions_count} options={{}} />
          </>
        )}

      </CModalBody>
    </CModal>
  );
};

export default SiteAnalyticsModal;
