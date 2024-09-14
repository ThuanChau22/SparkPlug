import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  CRow,
  CCol,
  CCard,
  CWidgetStatsA,
} from "@coreui/react";
import {
  CChartBar,
  CChartLine,
} from "@coreui/react-chartjs";
import { getStyle } from "@coreui/utils";

import EvseStatusWidget from "components/Dashboard/EvseStatusWidget";
import { apiInstance } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";

const Dashboard = () => {
  const StationAnalyticsAPI = process.env.REACT_APP_ANALYTICS_STATION_API_ENDPOINT;
  const token = useSelector(selectAuthAccessToken);

  const [dashboardData, setDashboardData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
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

  const fetchAnalyticsData = useCallback(async () => {
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
      setAnalyticsData(data);
    } catch (error) {
      console.log(error);
    }
  }, [StationAnalyticsAPI, startDate, endDate, chargeLevel, city, state, postalCode, country, token]);

  const fetchTransactions = useCallback(async () => {
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
      setDashboardData(parsedData);
    } catch (error) {
      console.log(error);
    }
  }, [StationAnalyticsAPI, token, startDate, endDate, chargeLevel]);

  useEffect(() => {
    fetchAnalyticsData();
    fetchTransactions();
  }, [fetchTransactions, fetchAnalyticsData]);

  const [timeCategoryChartData, setTimeCategoryChartData] = useState({
    labels: ['Off-Peak', 'Partial Peak', 'Peak'],
    datasets: [
      {
        label: 'Slow Charge',
        backgroundColor: 'rgba(255, 179, 102, 1)',
        borderColor: 'rgba(255,255,255,.55)',
        data: [0, 0, 0],
        barPercentage: 0.6,
        stack: 'Stack 0',
      },
      {
        label: 'Fast Charge',
        backgroundColor: 'rgba(255, 140, 0, 1)',
        borderColor: 'rgba(255,255,255,.55)',
        data: [0, 0, 0],
        barPercentage: 0.6,
        stack: 'Stack 0',
      },
    ],
  });

  const [driversChartData, setDriversChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Drivers per Month',
        backgroundColor: 'transparent',
        borderColor: 'rgba(144, 238, 144, 1)',
        pointBackgroundColor: getStyle('--cui-info'),
        data: [],
      },
    ],
  });

  const [stationChartData, setStationChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Stations per Month',
        backgroundColor: 'rgba(144, 238, 144, 1)',
        borderColor: 'rgba(255,255,255,.55)',
        data: [],
        barPercentage: 0.6,
      },
    ],
  });

  useEffect(() => {
    // Process the data to count transactions, sum fees, sum energy_kwh per month, and categorize time
    const transactionsPerMonth = {};
    const feesPerMonth = {};
    const energyPerMonth = {};
    const uniqueUsersPerMonth = {};
    const stationsPerMonth = {};
    const timeCategories = {
      offPeak: { fastCharge: 0, slowCharge: 0, energy: [] },
      partialPeak: { fastCharge: 0, slowCharge: 0, energy: [] },
      peak: { fastCharge: 0, slowCharge: 0, energy: [] },
    };

    dashboardData.forEach((transaction) => {
      const date = new Date(transaction.transaction_date);
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      const monthYear = `${month} ${year}`;

      if (!transactionsPerMonth[monthYear]) {
        transactionsPerMonth[monthYear] = 0;
        feesPerMonth[monthYear] = 0;
        energyPerMonth[monthYear] = 0;
        uniqueUsersPerMonth[monthYear] = new Set();
        stationsPerMonth[monthYear] = new Set();
      }
      transactionsPerMonth[monthYear] += 1;
      feesPerMonth[monthYear] += transaction.fee;
      energyPerMonth[monthYear] += transaction.energy_kwh;
      uniqueUsersPerMonth[monthYear].add(transaction.user_id);
      stationsPerMonth[monthYear].add(transaction.station_id);

      // Categorize by time and charge level
      const startDate = new Date(transaction.start_date);

      const hours = startDate.getHours();
      let category = '';
      if (hours >= 0 && hours < 12) {
        category = 'offPeak';
      } else if ((hours >= 12 && hours < 16) || (hours >= 21 && hours < 24)) {
        category = 'partialPeak';
      } else if (hours >= 16 && hours < 21) {
        category = 'peak';
      }

      const chargeLevel = transaction.charge_level === 'Level 2' ? 'fastCharge' : 'slowCharge';
      timeCategories[category][chargeLevel] += 1;
      timeCategories[category].energy.push({ monthYear, value: transaction.energy_kwh });
    });

    // Generate labels and data for the charts
    const labels = Object.keys(transactionsPerMonth).sort((a, b) => new Date(a) - new Date(b));
    const uniqueDriversData = labels.map((label) => uniqueUsersPerMonth[label].size);
    const stationData = labels.map((label) => stationsPerMonth[label].size);

    setTimeCategoryChartData({
      labels: ['Off-Peak', 'Partial Peak', 'Peak'],
      datasets: [
        {
          label: 'Slow Charge',
          backgroundColor: 'rgba(255, 179, 102, 1)',
          borderColor: 'rgba(255,255,255,.55)',
          data: [
            timeCategories.offPeak.slowCharge,
            timeCategories.partialPeak.slowCharge,
            timeCategories.peak.slowCharge,
          ],
          barPercentage: 0.6,
          stack: 'Stack 0',
        },
        {
          label: 'Fast Charge',
          backgroundColor: 'rgba(255, 140, 0, 1)',
          borderColor: 'rgba(255,255,255,.55)',
          data: [
            timeCategories.offPeak.fastCharge,
            timeCategories.partialPeak.fastCharge,
            timeCategories.peak.fastCharge,
          ],
          barPercentage: 0.6,
          stack: 'Stack 0',
        },
      ],
    });

    setDriversChartData({
      labels,
      datasets: [
        {
          label: 'Drivers per Month',
          backgroundColor: 'transparent',
          borderColor: 'rgba(144, 238, 144, 1)',
          pointBackgroundColor: getStyle('--cui-info'),
          data: uniqueDriversData,
        },
      ],
    });

    setStationChartData({
      labels,
      datasets: [
        {
          label: 'Stations per Month',
          backgroundColor: 'rgba(144, 238, 144, 1)',
          borderColor: 'rgba(255,255,255,.55)',
          data: stationData,
          barPercentage: 0.6,
        },
      ],
    });

  }, [dashboardData]);

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <EvseStatusWidget className="mx-4 mt-3" />
      <CRow
        className="m-3 mt-0"
        xs={{ cols: 1, gutter: 3 }}
        md={{ cols: 2 }}
        xxl={{ cols: 3 }}
      >
        <CCol>
          <CWidgetStatsA
            value={
              <>
                Sessions{' '}
              </>
            }
            chart={
              <CChartBar
                className="mt-3 mx-3"
                style={{ height: '120px' }}
                data={analyticsData.sessions_count}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        display: true,
                        drawTicks: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                    y: {
                      border: {
                        display: true,
                      },
                      grid: {
                        display: true,
                        drawBorder: true,
                        drawTicks: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                  },
                }}
              />
            }
          />
        </CCol>
        <CCol>
          <CWidgetStatsA
            value={
              <>
                Revenue{' '}
              </>
            }
            chart={
              <CChartLine
                className="mt-3 mx-3"
                style={{ height: '120px' }}
                data={analyticsData.revenue}
                options={{
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      border: {
                        display: true,
                      },
                      grid: {
                        display: true,
                        drawBorder: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                    y: {
                      min: 0,
                      //max: 89,
                      display: false,
                      grid: {
                        display: false,
                      },
                      ticks: {
                        display: false,
                      },
                    },
                  },
                  elements: {
                    line: {
                      borderWidth: 1,
                      tension: 0.4,
                    },
                    point: {
                      radius: 4,
                      hitRadius: 10,
                      hoverRadius: 4,
                    },
                  },
                }}
              />
            }
          />
        </CCol>
        <CCol>
          <CWidgetStatsA
            value={
              <>
                Energy/Consumption{' '}
              </>
            }
            chart={
              <CChartBar
                className="mt-3 mx-3"
                style={{ height: '120px' }}
                data={analyticsData.energy_consumption}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        display: true,
                        drawTicks: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                    y: {
                      border: {
                        display: true,
                      },
                      grid: {
                        display: true,
                        drawBorder: true,
                        drawTicks: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                  },
                }}
              />
            }
          />
        </CCol>
        <CCol>
          <CWidgetStatsA
            value={
              <>
                Peak/Off-peak Time{' '}
              </>
            }
            chart={
              <CChartBar
                className="mt-3 mx-3"
                style={{ height: '120px' }}
                data={analyticsData.peak_time}
                options={{
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      border: {
                        display: true,
                      },
                      grid: {
                        display: true,
                        drawBorder: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                    y: {
                      min: 0,
                      max: 100,
                      display: true,
                      grid: {
                        display: true,
                        drawBorder: true,
                      },
                      ticks: {
                        display: true,
                        callback: function (value) {
                          return value + "%";
                        },
                      },
                    },
                  },
                  elements: {
                    line: {
                      borderWidth: 2,
                      tension: 0.4,
                    },
                    point: {
                      radius: 0,
                      hitRadius: 10,
                      hoverRadius: 4,
                    },
                  },
                }}
              />
            }
          />
        </CCol>
        <CCol>
          <CWidgetStatsA
            value={
              <>
                Slow/Fast Charger{' '}
              </>
            }
            chart={
              <CChartBar
                className="mt-3 mx-3"
                style={{ height: '120px' }}
                data={timeCategoryChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        display: true,
                        drawTicks: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                    y: {
                      border: {
                        display: true,
                      },
                      grid: {
                        display: true,
                        drawBorder: true,
                        drawTicks: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                    xAxes: [
                      {
                        stacked: true,
                      },
                    ],
                    yAxes: [
                      {
                        stacked: true
                      }
                    ]
                  },
                }}
              />
            }
          />
        </CCol>
        {/* <CCol className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
          <CRow>Uptime Percentage</CRow>
          <CRow>
            <div style={{ height: '120px', width: '340px', display: 'flex', justifyContent: 'center' }}>
              
              <Doughnut data={donut_data} options={donut_options} /> 
            </div>
          </CRow>
        </CCol> */}
        <CCol>
          <CWidgetStatsA
            value={
              <>
                Driver{' '}
              </>
            }
            chart={
              <CChartLine
                className="mt-3 mx-3"
                style={{ height: '120px' }}
                data={driversChartData}
                options={{
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      border: {
                        display: true,
                      },
                      grid: {
                        display: true,
                        drawBorder: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                    y: {
                      min: 0,
                      // max: 39,
                      display: true,
                      grid: {
                        display: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                  },
                  elements: {
                    line: {
                      borderWidth: 1,
                    },
                    point: {
                      radius: 4,
                      hitRadius: 10,
                      hoverRadius: 4,
                    },
                  },
                }}
              />
            }
          />
        </CCol>
        <CCol>
          <CWidgetStatsA
            value={
              <>
                Owner{' '}
              </>
            }
            chart={
              <CChartLine
                className="mt-3 mx-3"
                style={{ height: '120px' }}
                data={{
                  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                  datasets: [
                    {
                      label: 'My First dataset',
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(191, 148, 228, 1)',
                      pointBackgroundColor: getStyle('--cui-info'),
                      data: [1, 18, 9, 17, 34, 22, 11],
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      border: {
                        display: true,
                      },
                      grid: {
                        display: true,
                        drawBorder: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                    y: {
                      min: 0,
                      max: 39,
                      display: true,
                      grid: {
                        display: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                  },
                  elements: {
                    line: {
                      borderWidth: 1,
                    },
                    point: {
                      radius: 4,
                      hitRadius: 10,
                      hoverRadius: 4,
                    },
                  },
                }}
              />
            }
          />
        </CCol>
        <CCol>
          <CWidgetStatsA
            value={
              <>
                Station
              </>
            }
            chart={
              <CChartBar
                className="mt-3 mx-3"
                style={{ height: '120px' }}
                data={stationChartData}
                options={{
                  indexAxis: 'y',
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        display: true,
                        drawTicks: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                    y: {
                      border: {
                        display: true,
                      },
                      grid: {
                        display: true,
                        drawBorder: true,
                        drawTicks: true,
                      },
                      ticks: {
                        display: true,
                      },
                    },
                  },
                }}
              />
            }
          />
        </CCol>
      </CRow>
    </CCard>
  )
}

export default Dashboard
