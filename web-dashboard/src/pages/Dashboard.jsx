import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardTitle,
  CProgress,
  CWidgetStatsA,
} from "@coreui/react";
import {
  CChartBar,
  CChartLine,
} from "@coreui/react-chartjs";
import { getStyle } from "@coreui/utils";

import { apiInstance } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";

const Dashboard = () => {
  const StationAnalyticsAPI = process.env.REACT_APP_ANALYTICS_STATION_API_ENDPOINT;
  const StationStatusAPI = process.env.REACT_APP_STATION_STATUS_API_ENDPOINT;
  const token = useSelector(selectAuthAccessToken);
  const [dashboardData, setDashboardData] = useState([]);
  const [evseStatus, setEvseStatus] = useState([]);

  const [stationList, setStationList] = useState([]);
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

  // Handle filter submissions
  const handleSubmit = () => {
    fetchAnalyticsData();
  };

  const fetchStatuses = useCallback(async () => {
    try {
      const base = `${StationStatusAPI}/latest`;
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await apiInstance.get(`${base}`, { headers });
      setEvseStatus(data);
    } catch (error) {
      console.log(error);
    }
  }, [StationStatusAPI, token]);

  const fetchTransactions = useCallback(async () => {
    try {
      const base = `${StationAnalyticsAPI}/transactions`;//get endpoint
      const params = [];
      if (startDate) params.push(`start_date=${formatDate(startDate)}`);
      if (endDate) params.push(`end_date=${formatDate(endDate)}`);
      if (chargeLevel !== "All") params.push(`charge_level=${chargeLevel}`);
      const query = params.length > 0 ? `?${params.join("&")}` : "";
      const headers = { Authorization: `Bearer ${token}` };//get the authori info

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
    fetchStatuses();
  }, [fetchTransactions, fetchAnalyticsData, fetchStatuses]);

  const countStatuses = (statusData) => {
    const statusCounts = {
      Available: 0,
      Unavailable: 0,
      Occupied: 0,
      total: statusData.length,
    };
    statusData.forEach(evse => {
      const lastUpdate = evse.status;
      if (lastUpdate in statusCounts) {
        statusCounts[lastUpdate]++;
      }
    })
    return [statusCounts.Available, statusCounts.Unavailable, statusCounts.Occupied, statusCounts.total];
  };

  const [availableCount, unavailableCount, inUseCount, totalCount] = countStatuses(evseStatus);
  const outOfServiceCount = totalCount - availableCount - unavailableCount - inUseCount;

  const calculatePercentage = (part, total) => {
    return total === 0 ? 0 : ((part / total) * 100).toFixed(1);
  };

  const availablePercentage = calculatePercentage(availableCount, totalCount);
  const unAvailablePercentage = calculatePercentage(unavailableCount, totalCount);
  const inUsePercentage = calculatePercentage(inUseCount, totalCount);
  const outOfServicePercentage = calculatePercentage(outOfServiceCount, totalCount);

  const progressExample = [
    { label: "Total", color: "info", count: totalCount, percentage: 100 },
    { label: "Available", color: "success", count: availableCount, percentage: availablePercentage },
    { label: "In Use", color: "warning", count: inUseCount, percentage: inUsePercentage },
    { label: "Out of Service", color: "danger", count: outOfServiceCount, percentage: outOfServicePercentage },
    { label: "Unavailable", color: "secondary", count: unavailableCount, percentage: unAvailablePercentage },
  ]

  const [barChartData, setBarChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Transactions per Month',
        backgroundColor: 'rgba(144, 238, 144, 1)',
        borderColor: 'rgba(255,255,255,.55)',
        data: [],
        barPercentage: 0.6,
      },
    ],
  });

  const [lineChartData, setLineChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Monthly Fees',
        backgroundColor: 'transparent',
        borderColor: 'rgba(255,255,255,.55)',
        pointBackgroundColor: getStyle('--cui-primary'),
        data: [],
      },
    ],
  });

  const [energyChartData, setEnergyChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Energy Consumption',
        backgroundColor: 'rgba(191, 148, 228, 1)',
        borderColor: 'rgba(255,255,255,.55)',
        data: [],
        barPercentage: 0.6,
      },
    ],
  });

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

  const [energyTimeChartData, setEnergyTimeChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Off-Peak Energy Consumption',
        backgroundColor: 'transparent',
        borderColor: getStyle('--cui-primary'),
        pointBackgroundColor: getStyle('--cui-primary'),
        data: [],
      },
      {
        label: 'Partial Peak Energy Consumption',
        backgroundColor: 'transparent',
        borderColor: getStyle('--cui-warning'),
        pointBackgroundColor: getStyle('--cui-warning'),
        data: [],
      },
      {
        label: 'Peak Energy Consumption',
        backgroundColor: 'transparent',
        borderColor: getStyle('--cui-danger'),
        pointBackgroundColor: getStyle('--cui-danger'),
        data: [],
      },
    ],
  });

  const [donutData, setDonutData] = useState({
    labels: ['Available', 'Unavailable', 'In Use'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
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

  const [ownersChartData, setOwnersChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Owners per Month',
        backgroundColor: 'transparent',
        borderColor: 'rgba(191, 148, 228, 1)',
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
    const evsePerMonth = {};
    const ownersPerMonth = {};
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
    const transactionData = labels.map((label) => transactionsPerMonth[label]);
    const feeData = labels.map((label) => feesPerMonth[label]);
    const energyData = labels.map((label) => energyPerMonth[label]);
    const uniqueDriversData = labels.map((label) => uniqueUsersPerMonth[label].size);
    const stationData = labels.map((label) => stationsPerMonth[label].size);
    evseStatus.forEach((evse) => {
      if (true) {
        const firstUpdate = evse.created_at;
        const date = new Date(firstUpdate.timestamp);
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        const monthYear = `${month} ${year}`;

        if (!ownersPerMonth[monthYear]) {
          ownersPerMonth[monthYear] = 0;
          evsePerMonth[monthYear] = new Set();
        }
        ownersPerMonth[monthYear] += 1;
        evsePerMonth[monthYear].add(evse.id);
      }
    });

    const evse_labels = Object.keys(ownersPerMonth).sort((a, b) => new Date(a) - new Date(b));
    const ownersData = evse_labels.map((label) => evsePerMonth[label].size);


    // Aggregate energy consumption by month for each category
    const aggregateEnergy = (category) => {
      const energyByMonth = {};

      timeCategories[category].energy.forEach((entry) => {
        if (!energyByMonth[entry.monthYear]) {
          energyByMonth[entry.monthYear] = 0;
        }
        energyByMonth[entry.monthYear] += entry.value;
      });
      return labels.map((label) => energyByMonth[label] || 0);
    };

    const offPeakEnergyData = aggregateEnergy('offPeak');
    const partialPeakEnergyData = aggregateEnergy('partialPeak');
    const peakEnergyData = aggregateEnergy('peak');

    // Calculate percentages
    const totalEnergyData = labels.map((label, index) => (
      offPeakEnergyData[index] + partialPeakEnergyData[index] + peakEnergyData[index]
    ));

    const offPeakPercentageData = offPeakEnergyData.map((value, index) => (
      (value / totalEnergyData[index]) * 100
    ));
    const partialPeakPercentageData = partialPeakEnergyData.map((value, index) => (
      (value / totalEnergyData[index]) * 100
    ));
    const peakPercentageData = peakEnergyData.map((value, index) => (
      (value / totalEnergyData[index]) * 100
    ));

    // Update the chart data
    setBarChartData({
      labels,
      datasets: [
        {
          label: 'Transactions per Month',
          backgroundColor: 'rgba(144, 238, 144, 1)',
          borderColor: 'rgba(255,255,255,.55)',
          data: transactionData,
          barPercentage: 0.6,
        },
      ],
    });

    setLineChartData({
      labels,
      datasets: [
        {
          label: 'Monthly Fees',
          backgroundColor: 'transparent',
          borderColor: 'rgba(255,255,255,.55)',
          pointBackgroundColor: getStyle('--cui-primary'),
          data: feeData,
        },
      ],
    });

    setEnergyChartData({
      labels,
      datasets: [
        {
          label: 'Energy Consumption',
          backgroundColor: 'rgba(191, 148, 228, 1)',
          borderColor: 'rgba(255,255,255,.55)',
          data: energyData,
          barPercentage: 0.6,
        },
      ],
    });

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

    setEnergyTimeChartData({
      labels,
      datasets: [
        {
          label: 'Off-Peak Energy Consumption',
          backgroundColor: 'transparent',
          borderColor: getStyle('--cui-primary'),
          pointBackgroundColor: getStyle('--cui-primary'),
          data: offPeakPercentageData,
        },
        {
          label: 'Partial Peak Energy Consumption',
          backgroundColor: 'transparent',
          borderColor: getStyle('--cui-warning'),
          pointBackgroundColor: getStyle('--cui-warning'),
          data: partialPeakPercentageData,
        },
        {
          label: 'Peak Energy Consumption',
          backgroundColor: 'transparent',
          borderColor: getStyle('--cui-danger'),
          pointBackgroundColor: getStyle('--cui-danger'),
          data: peakPercentageData,
        },
      ],
    });

    const calculateUptime = (data) => {
      let availableCount = 0;
      let unavailableCount = 0;
      let inUseCount = 0;
      let totalCount = 0;

      // Check if 'data' is a valid array before calling forEach
      if (Array.isArray(data)) {
        data.forEach((evse) => {
          // Check if 'evse.updates' is a valid array before calling forEach
          if (Array.isArray(evse.updates)) {
            evse.updates.forEach((update) => {
              if (update.new_status === 'available') {
                availableCount += 1;
              } else if (update.new_status === 'unavailable') {
                unavailableCount += 1;
              } else if (update.new_status === 'in_use') {
                inUseCount += 1;
              }
              totalCount += 1;
            });
          }
        });
      }

      const availablePercentage = totalCount === 0 ? 0 : (availableCount / totalCount) * 100;
      const unavailablePercentage = totalCount === 0 ? 0 : (unavailableCount / totalCount) * 100;
      const inUsePercentage = totalCount === 0 ? 0 : (inUseCount / totalCount) * 100;

      return [availablePercentage, unavailablePercentage, inUsePercentage];
    };


    const [availablePercentage, unavailablePercentage, inUsePercentage] = calculateUptime(evseStatus);

    setDonutData({
      labels: ['Available', 'Unavailable', 'In Use'],
      datasets: [
        {
          data: [availablePercentage, unavailablePercentage, inUsePercentage],
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
          hoverBackgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
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

    setOwnersChartData({
      labels,
      datasets: [
        {
          label: 'Number of Owners per Month',
          backgroundColor: 'transparent',
          borderColor: 'rgba(191, 148, 228, 1)',
          pointBackgroundColor: getStyle('--cui-info'),
          data: ownersData,
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

  }, [dashboardData, evseStatus]);

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CRow className="m-2">
        <CCol>
          <CCard>
            <CCardBody>
              <CCardTitle className="fs-4 fw-semibold">
                Chargers
              </CCardTitle>
              <CRow className="mb-2 text-center">
                {progressExample.map(({ label, color, count, percentage }, index) => (
                  <CCol key={index}>
                    <p className="fw-semibold mb-2">{label}: {count} ({percentage}%)</p>
                    <CProgress thin color={color} value={percentage} />
                  </CCol>
                ))}
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CRow className="m-2">
        <CCol xs={6}>
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
        <CCol xs={6}>
          <CWidgetStatsA

            value={
              <>
                Revenue{' '}
              </>
            }
            chart={
              <CChartLine
                //ref={WidgetsDropdown.widgetChartRef1}
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
      </CRow>
      <CRow className="m-2">
        <CCol xs={6}>
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
        <CCol xs={6}>
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
      </CRow>
      <CRow className="m-2">
        <CCol xs={6}>
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
        <CCol xs={6} className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
          {/* <CRow>Uptime Percentage</CRow>
          <CRow>
            <div style={{ height: '120px', width: '340px', display: 'flex', justifyContent: 'center' }}>
              
              <Doughnut data={donut_data} options={donut_options} /> 
            </div>
          </CRow>*/}
        </CCol>
      </CRow>
      <CRow className="m-2">
        <CCol xs={6}>
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
        <CCol xs={6}>
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
      </CRow>
      <CRow className="m-2">
        <CCol xs={6}>
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