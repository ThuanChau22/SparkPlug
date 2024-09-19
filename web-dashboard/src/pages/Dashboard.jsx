import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { CRow, CCol, CCard } from "@coreui/react";
import { getStyle } from "@coreui/utils";

import DriverGrowthChartWidget from "components/Dashboard/DriverGrowthChartWidget";
import EnergyConsumptionChartWidget from "components/Dashboard/EnergyConsumptionChartWidget";
import EvseStatusWidget from "components/Dashboard/EvseStatusWidget";
import OwnerGrowthChartWidget from "components/Dashboard/OwnerGrowthChartWidget";
import PeakTimeChartWidget from "components/Dashboard/PeakTimeChartWidget";
import RevenueChartWidget from "components/Dashboard/RevenueChartWidget";
import SessionCountChartWidget from "components/Dashboard/SessionCountChartWidget";
import StationGrowthChartWidget from "components/Dashboard/StationGrowthChartWidget";
import { apiInstance } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";

const Dashboard = () => {
  const StationAnalyticsAPI = process.env.REACT_APP_ANALYTICS_STATION_API_ENDPOINT;
  const token = useSelector(selectAuthAccessToken);

  const [chartData, setChartData] = useState({});
  const [transactionData, setTransactionData] = useState(null);
  const [driversChartData, setDriversChartData] = useState(null);
  const [stationChartData, setStationChartData] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chargeLevel, setChargeLevel] = useState("All");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

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

  const fetchChartData = useCallback(async () => {
    try {
      const base = `${StationAnalyticsAPI}/charts`;
      const params = [];
      if (startDate) params.push(`start_date=${formatDate(startDate)}`);
      if (endDate) params.push(`end_date=${formatDate(endDate)}`);
      if (chargeLevel !== "All") params.push(`charge_level=${chargeLevel}`);
      if (city) params.push(`city=${city}`);
      if (state) params.push(`state=${state}`);
      if (postalCode) params.push(`postal_code=${postalCode}`);
      if (country) params.push(`country=${country}`);
      const query = params.length > 0 ? `?${params.join("&")}` : "";
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await apiInstance.get(`${base}${query}`, { headers });
      setChartData(data);
    } catch (error) {
      console.log(error);
    }
  }, [StationAnalyticsAPI, token, startDate, endDate, chargeLevel, city, state, postalCode, country]);

  const fetchTransactionData = useCallback(async () => {
    try {
      const base = `${StationAnalyticsAPI}/transactions`;
      const params = [];
      if (startDate) params.push(`start_date=${formatDate(startDate)}`);
      if (endDate) params.push(`end_date=${formatDate(endDate)}`);
      if (chargeLevel !== "All") params.push(`charge_level=${chargeLevel}`);
      const query = params.length > 0 ? `?${params.join("&")}` : "";
      const headers = { Authorization: `Bearer ${token}` };
      const response = await apiInstance.get(`${base}${query}`, { headers });
      const parsedData = response.data;
      setTransactionData(parsedData);
    } catch (error) {
      console.log(error);
    }
  }, [StationAnalyticsAPI, token, startDate, endDate, chargeLevel]);

  useEffect(() => {
    fetchChartData();
    fetchTransactionData();
  }, [fetchChartData, fetchTransactionData]);

  useEffect(() => {
    if (transactionData) {
      const transactionsPerMonth = {};
      const uniqueUsersPerMonth = {};
      const stationsPerMonth = {};

      for (const transaction of transactionData) {
        const date = new Date(transaction.transaction_date);
        const month = date.toLocaleString("default", { month: "long" });
        const year = date.getFullYear();
        const monthYear = `${month} ${year}`;
        if (!transactionsPerMonth[monthYear]) {
          transactionsPerMonth[monthYear] = 0;
          uniqueUsersPerMonth[monthYear] = new Set();
          stationsPerMonth[monthYear] = new Set();
        }
        transactionsPerMonth[monthYear] += 1;
        uniqueUsersPerMonth[monthYear].add(transaction.user_id);
        stationsPerMonth[monthYear].add(transaction.station_id);
      }

      const labels = Object.keys(transactionsPerMonth).sort((a, b) => new Date(a) - new Date(b));
      const uniqueDriversData = labels.map((label) => uniqueUsersPerMonth[label].size);
      const stationData = labels.map((label) => stationsPerMonth[label].size);

      setDriversChartData({
        labels,
        datasets: [
          {
            label: "Drivers per Month",
            backgroundColor: "transparent",
            borderColor: "rgb(144, 238, 144)",
            pointBackgroundColor: getStyle("--cui-info"),
            data: uniqueDriversData,
          },
        ],
      });

      setStationChartData({
        labels,
        datasets: [
          {
            label: "Stations per Month",
            backgroundColor: "rgb(144, 238, 144)",
            borderColor: "rgba(255,255,255,.55)",
            data: stationData,
            barPercentage: 0.6,
          },
        ],
      });
    }
  }, [transactionData]);

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <EvseStatusWidget className="mx-4 mt-3 shadow-sm" />
      <CRow
        className="m-3 mt-0"
        xs={{ cols: 1, gutter: 3 }}
        md={{ cols: 2 }}
        xxl={{ cols: 3 }}
      >
        <CCol>
          <SessionCountChartWidget
            data={chartData.sessions_count}
          />
        </CCol>
        <CCol>
          <RevenueChartWidget
            data={chartData.revenue}
          />
        </CCol>
        <CCol>
          <EnergyConsumptionChartWidget
            data={chartData.energy_consumption}
          />
        </CCol>
        <CCol>
          <PeakTimeChartWidget
            data={chartData.peak_time}
          />
        </CCol>
        {/* <CCol className="d-flex justify-content-center align-items-center" style={{ height: "100%" }}>
          <CRow>Uptime Percentage</CRow>
          <CRow>
            <div style={{ height: "120px", width: "340px", display: "flex", justifyContent: "center" }}>
              <Doughnut data={donut_data} options={donut_options} /> 
            </div>
          </CRow>
        </CCol> */}
        <CCol>
          <DriverGrowthChartWidget
            data={driversChartData}
          />
        </CCol>
        <CCol>
          <OwnerGrowthChartWidget
            data={{
              labels: ["January", "February", "March", "April", "May", "June", "July"],
              datasets: [
                {
                  label: "Owners per Month",
                  borderColor: "rgb(191, 148, 228)",
                  pointBackgroundColor: getStyle("--cui-info"),
                  data: [1, 18, 9, 17, 34, 22, 11],
                },
              ],
            }}
          />
        </CCol>
        <CCol>
          <StationGrowthChartWidget
            data={stationChartData}
          />
        </CCol>
      </CRow>
    </CCard>
  )
}

export default Dashboard
