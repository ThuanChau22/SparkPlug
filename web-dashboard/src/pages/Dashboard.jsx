import React from 'react'
import classNames from 'classnames'
import '../scss/style.scss'
import { CChartPie } from '@coreui/react-chartjs';
import { CChartDoughnut } from '@coreui/react-chartjs';
import { cilArrowBottom, cilArrowTop, cilOptions } from '@coreui/icons'
import { CChart } from '@coreui/react-chartjs';
import { Pie } from 'react-chartjs-2';
import {
  CRow,
  CCol,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  CDropdownToggle,
  CWidgetStatsA,
} from '@coreui/react'
import { getStyle } from '@coreui/utils'
import { CChartBar, CChartLine } from '@coreui/react-chartjs'
import {
  CAvatar,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CProgress,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CContainer,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cibCcAmex,
  cibCcApplePay,
  cibCcMastercard,
  cibCcPaypal,
  cibCcStripe,
  cibCcVisa,
  cibGoogle,
  cibFacebook,
  cibLinkedin,
  cifBr,
  cifEs,
  cifFr,
  cifIn,
  cifPl,
  cifUs,
  cibTwitter,
  cilCloudDownload,
  cilPeople,
  cilUser,
  cilUserFemale,
} from '@coreui/icons'

import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';


import avatar1 from '../assets/default-avatar.jpg'
import avatar2 from '../assets/default-avatar.jpg'
import avatar3 from '../assets/default-avatar.jpg'
import avatar4 from '../assets/default-avatar.jpg'
import avatar5 from '../assets/default-avatar.jpg'
import avatar6 from '../assets/default-avatar.jpg'

import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { apiInstance } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import { selectStationById } from "redux/station/stationSlice";


Chart.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const stationId = 1392;
  const StationAnalyticsAPI = process.env.REACT_APP_ANALYTICS_STATION_API_ENDPOINT;
  const station = useSelector((state) => selectStationById(state, stationId));
  const token = useSelector(selectAuthAccessToken);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dashboardData, setDashboardData] = useState([]);
  const [EVSEStatus, setEVSEStatus] = useState([]);

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

      const status_base = `${StationAnalyticsAPI}/evse_status`;//get endpoint
      const status_response = await apiInstance.get(`${status_base}${query}`, { headers });
      setEVSEStatus(status_response.data);
    } catch (error) {
      console.log(error);
    }
  }, [StationAnalyticsAPI, stationId, token, startDate, endDate, chargeLevel]);


  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const countStatuses = (statusData) => {
    const statusCounts = {
      available: 0,
      unavailable: 0,
      in_use: 0
    };

    statusData.forEach(evse => {
      const lastUpdate = evse.updates[evse.updates.length - 1];
      if (lastUpdate.new_status in statusCounts) {
        statusCounts[lastUpdate.new_status]++;
      }
    });

    return [statusCounts.available, statusCounts.unavailable, statusCounts.in_use];
  };

  const [availableCount, unavailableCount, inUseCount] = countStatuses(EVSEStatus);
  const outOfServiceCount = EVSEStatus.length - availableCount - unavailableCount - inUseCount;

  const calculatePercentage = (part, total) => {
    return total === 0 ? 0 : ((part / total) * 100).toFixed(1);
  };

  const availablePercentage = calculatePercentage(availableCount, EVSEStatus.length);
  const unAvailablePercentage = calculatePercentage(unavailableCount, EVSEStatus.length);
  const inUsePercentage = calculatePercentage(inUseCount, EVSEStatus.length);
  const outOfServicePercentage = calculatePercentage(outOfServiceCount, EVSEStatus.length);

  const progressExample = [
    { title: 'Total Chargers', value: EVSEStatus.length, percent: 100, color: 'success' },
    { title: 'Available Chargers', value: availableCount, percent: availablePercentage, color: 'info' },
    { title: 'In Use Chargers', value: inUseCount, percent: inUsePercentage, color: 'warning' },
    { title: 'Out of Service Chargers', value: outOfServiceCount, percent: outOfServicePercentage, color: 'danger' },
    { title: 'Unavailable Chargers', value: unavailableCount, percent: unAvailablePercentage, color: 'primary' },
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

    EVSEStatus.forEach((evse) => {
      if (evse.updates.length > 0) {
        const firstUpdate = evse.updates[0];
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

      data.forEach((evse) => {
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
      });

      const availablePercentage = (availableCount / totalCount) * 100;
      const unavailablePercentage = (unavailableCount / totalCount) * 100;
      const inUsePercentage = (inUseCount / totalCount) * 100;

      return [availablePercentage, unavailablePercentage, inUsePercentage];
    };

    const [availablePercentage, unavailablePercentage, inUsePercentage] = calculateUptime(EVSEStatus);

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

  }, [dashboardData, EVSEStatus]);

  const progressGroupExample1 = [
    { title: 'Monday', value1: 34, value2: 78 },
    { title: 'Tuesday', value1: 56, value2: 94 },
    { title: 'Wednesday', value1: 12, value2: 67 },
    { title: 'Thursday', value1: 43, value2: 91 },
    { title: 'Friday', value1: 22, value2: 73 },
    { title: 'Saturday', value1: 53, value2: 82 },
    { title: 'Sunday', value1: 9, value2: 69 },
  ]

  const progressGroupExample2 = [
    { title: 'Male', icon: cilUser, value: 53 },
    { title: 'Female', icon: cilUserFemale, value: 43 },
  ]

  const progressGroupExample3 = [
    { title: 'Organic Search', icon: cibGoogle, percent: 56, value: '191,235' },
    { title: 'Facebook', icon: cibFacebook, percent: 15, value: '51,223' },
    { title: 'Twitter', icon: cibTwitter, percent: 11, value: '37,564' },
    { title: 'LinkedIn', icon: cibLinkedin, percent: 8, value: '27,319' },
  ]

  // Bar Chart (Sessions)
  const barData = {
    labels: ["1/6", "2/6", "3/6", "4/6", "5/6", "6/6", "7/6", "8/6", "9/6", "10/6", "11/6", "12/6"],
    datasets: [
      {
        label: 'Sessions',
        data: [4000, 3000, 2000, 4500, 4700, 3000, 4500, 2000, 3000, 4500, 3000, 4000],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Time',
        data: [2000, 1500, 3000, 2000, 2200, 2800, 2400, 3500, 3200, 2400, 3500, 3200],
        backgroundColor: 'rgba(0, 123, 255, 0.5)',
      }
    ],
  };

  // Line Chart (Revenue over Time)
  const lineData = {
    labels: ["1/6", "2/6", "3/6", "4/6", "5/6", "6/6", "7/6", "8/6", "9/6", "10/6", "11/6", "12/6"],
    datasets: [
      {
        label: 'Revenue',
        data: [65, 59, 80, 81, 56, 55, 40, 60, 45, 70, 50, 75],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Time',
        data: [45, 49, 60, 70, 46, 75, 50, 65, 40, 70, 60, 65],
        fill: false,
        borderColor: 'rgb(255, 159, 64)',
        tension: 0.1
      }
    ]
  };

  const donut_data = {
    labels: ['Available', 'Unavailable', 'In-Use'],
    datasets: [
      {
        label: 'Uptime Percentage',
        data: [49.9, 13.4, 36.7],
        backgroundColor: [
          'rgba(144, 238, 144, 0.2)', // Light Green
          'rgba(0, 128, 0, 0.2)',     // Medium Green
          'rgba(34, 139, 34, 0.2)',   // Dark Green
          'rgba(0, 100, 0, 0.2)'      // Very Dark Green
        ],
        borderColor: [
          'rgba(144, 238, 144, 1)', // Light Green
          'rgba(0, 128, 0, 1)',     // Medium Green
          'rgba(34, 139, 34, 1)',   // Dark Green
          'rgba(0, 100, 0, 1)'      // Very Dark Green
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const donut_options = {
    cutout: '50%',  // This makes it a donut chart
    plugins: {
      legend: {
        display: false  // This will hide the legend
      }
    }
  };

  // Define options for charts
  const options = {
    scales: {
      y: {
        beginAtZero: true
      }
    },
    maintainAspectRatio: false
  };

  const horizontal_bar_options = {
    indexAxis: 'y', // This makes the bar chart horizontal
    elements: {
      bar: {
        borderWidth: 2,
      },
    },
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Horizontal Bar Chart',
      },
    },
  };
  
  const horizontal_bar_data = {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
    datasets: [
      {
        label: '# of Votes',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const pie_data = {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
    datasets: [
      {
        label: '# of Votes',
        data: [12, 19, 3, 5, 2],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1,
      }
    ],
  };
  
  const pie_options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    }
  };

  const tableExample = [
    {
      avatar: { src: avatar1, status: 'success' },
      user: {
        name: 'Yiorgos Avraamu',
        new: true,
        registered: 'Jan 1, 2023',
      },
      country: { name: 'USA', flag: cifUs },
      usage: {
        value: 50,
        period: 'Jun 11, 2023 - Jul 10, 2023',
        color: 'success',
      },
      payment: { name: 'Mastercard', icon: cibCcMastercard },
      activity: '10 sec ago',
    },
    {
      avatar: { src: avatar2, status: 'danger' },
      user: {
        name: 'Avram Tarasios',
        new: false,
        registered: 'Jan 1, 2023',
      },
      country: { name: 'Brazil', flag: cifBr },
      usage: {
        value: 22,
        period: 'Jun 11, 2023 - Jul 10, 2023',
        color: 'info',
      },
      payment: { name: 'Visa', icon: cibCcVisa },
      activity: '5 minutes ago',
    },
    {
      avatar: { src: avatar3, status: 'warning' },
      user: { name: 'Quintin Ed', new: true, registered: 'Jan 1, 2023' },
      country: { name: 'India', flag: cifIn },
      usage: {
        value: 74,
        period: 'Jun 11, 2023 - Jul 10, 2023',
        color: 'warning',
      },
      payment: { name: 'Stripe', icon: cibCcStripe },
      activity: '1 hour ago',
    },
    {
      avatar: { src: avatar4, status: 'secondary' },
      user: { name: 'Enéas Kwadwo', new: true, registered: 'Jan 1, 2023' },
      country: { name: 'France', flag: cifFr },
      usage: {
        value: 98,
        period: 'Jun 11, 2023 - Jul 10, 2023',
        color: 'danger',
      },
      payment: { name: 'PayPal', icon: cibCcPaypal },
      activity: 'Last month',
    },
    {
      avatar: { src: avatar5, status: 'success' },
      user: {
        name: 'Agapetus Tadeáš',
        new: true,
        registered: 'Jan 1, 2023',
      },
      country: { name: 'Spain', flag: cifEs },
      usage: {
        value: 22,
        period: 'Jun 11, 2023 - Jul 10, 2023',
        color: 'primary',
      },
      payment: { name: 'Google Wallet', icon: cibCcApplePay },
      activity: 'Last week',
    },
    {
      avatar: { src: avatar6, status: 'danger' },
      user: {
        name: 'Friderik Dávid',
        new: true,
        registered: 'Jan 1, 2023',
      },
      country: { name: 'Poland', flag: cifPl },
      usage: {
        value: 43,
        period: 'Jun 11, 2023 - Jul 10, 2023',
        color: 'success',
      },
      payment: { name: 'Amex', icon: cibCcAmex },
      activity: 'Last week',
    },
  ]

  return (
    <div>
      <CRow
            xs={{ cols: 1, gutter: 4 }}
            sm={{ cols: 2 }}
            lg={{ cols: 4 }}
            xl={{ cols: 5 }}
            className="mb-2 text-center"
            style={{ color: 'white' }} 
      >
        {progressExample.map((item, index, items) => (
          <CCol
            className={classNames({
              'd-none d-xl-block': index + 1 === items.length,
            })}
            key={index}
          >
            <div>{item.title}</div>
            <div className="fw-semibold text-truncate">
              {item.value} ({item.percent}%)
            </div>
            <CProgress thin className="mt-2" color={item.color} value={item.percent} />
          </CCol>
        ))}
      </CRow>
      <CRow className="custom-row-spacing">
        <CCol xs={6}>
          <CWidgetStatsA
            color="dark"
            value={
              <>
                Sessions{' '}
              </>
            }
            chart={
              <CChartBar
                className="mt-3 mx-3"
                style={{ height: '120px' }}
                data={barChartData}
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
            color="dark"
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
                data={lineChartData}
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
      <CRow className="custom-row-spacing">
        <CCol xs={6}>
          <CWidgetStatsA
            color="dark"
            value={
              <>
                Engery/Consumption{' '}
              </>
            }
            chart={
              <CChartBar
                className="mt-3 mx-3"
                style={{ height: '120px' }}
                data={energyChartData}
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
      color="dark"
      value={
        <>
          Peak/Off-peak Time{' '}
        </>
      }
      chart={
        <CChartLine
          className="mt-3 mx-3"
          style={{ height: '120px' }}
          data={energyTimeChartData}
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
                  callback: function(value) {
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
      <CRow className="custom-row-spacing">
        <CCol xs={6}>
          <CWidgetStatsA
            color="dark"
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
        <CCol xs={6} className="d-flex justify-content-center align-items-center" style={{ height: '100%'}}>
         {/* <CRow>Uptime Percentage</CRow>
          <CRow>
            <div style={{ height: '120px', width: '340px', display: 'flex', justifyContent: 'center' }}>
              
              <Doughnut data={donut_data} options={donut_options} /> 
            </div>
          </CRow>*/}
        </CCol>
      </CRow> 
      <CRow className="custom-row-spacing">
        <CCol xs={6}>
        <CWidgetStatsA
            color="dark"
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
            color="dark"
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
      <CRow className="custom-row-spacing">
        <CCol xs={6}>
        <CWidgetStatsA
            color="dark"
            value={
              <>
                Station{' '}
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
        <CCol xs={6}>
        {/*<CRow>Station Growth by Region</CRow>
        <CRow>
        <div style={{ height: '120px', width: '340px', display: 'flex', justifyContent: 'center' }}>
          <Pie data={pie_data} options={pie_options} />
        </div>
          </CRow>*/}
        </CCol>
      </CRow>
    
    </div>
  )
}

export default Dashboard