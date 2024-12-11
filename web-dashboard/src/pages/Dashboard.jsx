import { useSelector } from "react-redux";
import { CRow, CCol, CCard } from "@coreui/react";

import DriverGrowthChartWidget from "components/Dashboard/DriverGrowthChartWidget";
import EnergyConsumptionChartWidget from "components/Dashboard/EnergyConsumptionChartWidget";
import EvseStatusWidget from "components/Dashboard/EvseStatusWidget";
import OwnerGrowthChartWidget from "components/Dashboard/OwnerGrowthChartWidget";
import PeakTimeChartWidget from "components/Dashboard/PeakTimeChartWidget";
import RevenueChartWidget from "components/Dashboard/RevenueChartWidget";
import SessionCountChartWidget from "components/Dashboard/SessionCountChartWidget";
import StationGrowthChartWidget from "components/Dashboard/StationGrowthChartWidget";
import { selectAuthRoleIsStaff } from "redux/auth/authSlice";

const Dashboard = () => {
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);

  // const [startDate, setStartDate] = useState("");
  // const [endDate, setEndDate] = useState("");
  // const [chargeLevel, setChargeLevel] = useState("All");
  // const [city, setCity] = useState("");
  // const [state, setState] = useState("");
  // const [postalCode, setPostalCode] = useState("");
  // const [country, setCountry] = useState("");

  // const formatDate = (dateStr) => {
  //   if (!dateStr) return "";
  //   const date = new Date(dateStr);
  //   let month = "" + (date.getMonth() + 1);
  //   let day = "" + date.getDate();
  //   const year = date.getFullYear();
  //   if (month.length < 2) month = "0" + month;
  //   if (day.length < 2) day = "0" + day;
  //   return [month, day, year].join("/");
  // };

  // const fetchChartData = useCallback(async () => {
  //   try {
  //     const base = `${StationAnalyticsAPI}/charts`;
  //     const params = [];
  //     if (startDate) params.push(`start_date=${formatDate(startDate)}`);
  //     if (endDate) params.push(`end_date=${formatDate(endDate)}`);
  //     if (chargeLevel !== "All") params.push(`charge_level=${chargeLevel}`);
  //     if (city) params.push(`city=${city}`);
  //     if (state) params.push(`state=${state}`);
  //     if (postalCode) params.push(`postal_code=${postalCode}`);
  //     if (country) params.push(`country=${country}`);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }, [StationAnalyticsAPI, token, startDate, endDate, chargeLevel, city, state, postalCode, country]);

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
          <SessionCountChartWidget />
        </CCol>
        <CCol>
          <RevenueChartWidget />
        </CCol>
        <CCol>
          <EnergyConsumptionChartWidget />
        </CCol>
        <CCol>
          <PeakTimeChartWidget />
        </CCol>
        {/* <CCol className="d-flex justify-content-center align-items-center" style={{ height: "100%" }}>
          <CRow>Uptime Percentage</CRow>
          <CRow>
            <div style={{ height: "120px", width: "340px", display: "flex", justifyContent: "center" }}>
              <Doughnut data={donut_data} options={donut_options} /> 
            </div>
          </CRow>
        </CCol> */}
        {authIsAdmin && (
          <>
            <CCol>
              <DriverGrowthChartWidget />
            </CCol>
            <CCol>
              <OwnerGrowthChartWidget />
            </CCol>
          </>
        )}
        <CCol>
          <StationGrowthChartWidget />
        </CCol>
      </CRow>
    </CCard>
  )
}

export default Dashboard
