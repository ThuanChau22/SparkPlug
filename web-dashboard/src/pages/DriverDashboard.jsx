import { CRow, CCol, CCard } from "@coreui/react";

import DriverStatusWidget from "components/DriverDashboard/DriverStatusWidget";
import DriverEnergyConsumptionByStationChartWidget from "components/DriverDashboard/EnergyConsumptionByStationWidget";
import DriverEnergyConsumptionByTimeChartWidget from "components/DriverDashboard/EnergyConsumptionByTimeWidget";
import DriverRevenueByStationChartWidget from "components/DriverDashboard/RevenueByStationWidget";
import DriverRevenueByTimeChartWidget from "components/DriverDashboard/RevenueByTimeWidget";
import DriverSessionCountByStationChartWidget from "components/DriverDashboard/SessionCountByStationWidget";
import DriverSessionCountByTimeChartWidget from "components/DriverDashboard/SessionCountByTimeWidget";

const DriverDashboard = () => {
  // const StationAnalyticsAPI = process.env.REACT_APP_ANALYTICS_STATION_API_ENDPOINT;
  // const token = useSelector(selectAuthAccessToken);

  // const [chartData, setChartData] = useState({});
  // const [transactionData, setTransactionData] = useState(null);
  // const [driversChartData, setDriversChartData] = useState(null);
  // const [stationChartData, setStationChartData] = useState(null);

  // const [startDate, setStartDate] = useState("");
  // const [endDate, setEndDate] = useState("");
  // const [chargeLevel, setChargeLevel] = useState("All");
  // const [city, setCity] = useState("");
  // const [state, setState] = useState("");
  // const [postalCode, setPostalCode] = useState("");
  // const [country, setCountry] = useState("");

  // const fetchChartData = useCallback(async () => {
  //   try {
  //     const base = `${StationAnalyticsAPI}/charts`;
  //     const params = [];
  //     if (startDate) params.push(`start_date=${startDate}`);
  //     if (endDate) params.push(`end_date=${endDate}`);
  //     if (chargeLevel !== "All") params.push(`charge_level=${chargeLevel}`);
  //     if (city) params.push(`city=${city}`);
  //     if (state) params.push(`state=${state}`);
  //     if (postalCode) params.push(`postal_code=${postalCode}`);
  //     if (country) params.push(`country=${country}`);
  //     const query = params.length > 0 ? `?${params.join("&")}` : "";
  //     const headers = { Authorization: `Bearer ${token}` };
  //     const { data } = await apiInstance.get(`${base}${query}`, { headers });
  //     setChartData(data);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }, [StationAnalyticsAPI, token, startDate, endDate, chargeLevel, city, state, postalCode, country]);

  // const fetchTransactionData = useCallback(async () => {
  //   try {
  //     const base = `${StationAnalyticsAPI}/transactions`;
  //     const params = [];
  //     if (startDate) params.push(`start_date=${startDate}`);
  //     if (endDate) params.push(`end_date=${endDate}`);
  //     if (chargeLevel !== "All") params.push(`charge_level=${chargeLevel}`);
  //     const query = params.length > 0 ? `?${params.join("&")}` : "";
  //     const headers = { Authorization: `Bearer ${token}` };
  //     const response = await apiInstance.get(`${base}${query}`, { headers });
  //     const parsedData = response.data;
  //     setTransactionData(parsedData);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }, [StationAnalyticsAPI, token, startDate, endDate, chargeLevel]);

  // useEffect(() => {
  //   fetchChartData();
  //   fetchTransactionData();
  // }, [fetchChartData, fetchTransactionData]);

  // useEffect(() => {
  //   if (transactionData) {
  //     const transactionsPerMonth = {};
  //     const uniqueUsersPerMonth = {};
  //     const stationsPerMonth = {};

  //     for (const transaction of transactionData) {
  //       const date = new Date(transaction.transaction_date);
  //       const month = date.toLocaleString("default", { month: "long" });
  //       const year = date.getFullYear();
  //       const monthYear = `${month} ${year}`;
  //       if (!transactionsPerMonth[monthYear]) {
  //         transactionsPerMonth[monthYear] = 0;
  //         uniqueUsersPerMonth[monthYear] = new Set();
  //         stationsPerMonth[monthYear] = new Set();
  //       }
  //       transactionsPerMonth[monthYear] += 1;
  //       uniqueUsersPerMonth[monthYear].add(transaction.user_id);
  //       stationsPerMonth[monthYear].add(transaction.station_id);
  //     }

  //     const labels = Object.keys(transactionsPerMonth).sort((a, b) => new Date(a) - new Date(b));
  //     const uniqueDriversData = labels.map((label) => uniqueUsersPerMonth[label].size);
  //     const stationData = labels.map((label) => stationsPerMonth[label].size);

  //     setDriversChartData({
  //       labels,
  //       datasets: [
  //         {
  //           label: "Drivers per Month",
  //           backgroundColor: "transparent",
  //           borderColor: "rgb(144, 238, 144)",
  //           pointBackgroundColor: getStyle("--cui-info"),
  //           data: uniqueDriversData,
  //         },
  //       ],
  //     });

  //     setStationChartData({
  //       labels,
  //       datasets: [
  //         {
  //           label: "Stations per Month",
  //           backgroundColor: "rgb(144, 238, 144)",
  //           borderColor: "rgba(255,255,255,.55)",
  //           data: stationData,
  //           barPercentage: 0.6,
  //         },
  //       ],
  //     });
  //   }
  // }, [transactionData]);

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <DriverStatusWidget className="mx-4 mt-3 shadow-sm" />
      <CRow
        className="m-3 mt-0"
        xs={{ cols: 1, gutter: 3 }}
        md={{ cols: 2 }}
        xxl={{ cols: 3 }}
      >
        <CCol>
          <DriverRevenueByTimeChartWidget />
        </CCol>
        <CCol>
          <DriverSessionCountByTimeChartWidget />
        </CCol>
        <CCol>
          <DriverEnergyConsumptionByTimeChartWidget />
        </CCol>
        <CCol>
          <DriverRevenueByStationChartWidget />
        </CCol>
        <CCol>
          <DriverSessionCountByStationChartWidget />
        </CCol>
        <CCol>
          <DriverEnergyConsumptionByStationChartWidget />
        </CCol>
      </CRow>
    </CCard>
  )
};

export default DriverDashboard;
