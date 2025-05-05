import { useState } from "react";
import { useSelector } from "react-redux";
import {
  CCard,
  CCol,
  CRow,
} from "@coreui/react";

import FilterBar from "components/FilterBar";
import FilterModal from "components/FilterModal";
import StickyContainer from "components/StickyContainer";
import DriverGrowthChartWidget from "components/Dashboard/DriverGrowthChartWidget";
import EnergyConsumptionChartWidget from "components/Dashboard/EnergyConsumptionChartWidget";
import EvseStatusWidget from "components/Dashboard/EvseStatusWidget";
import OwnerGrowthChartWidget from "components/Dashboard/OwnerGrowthChartWidget";
import PeakTimeChartWidget from "components/Dashboard/PeakTimeChartWidget";
import RevenueChartWidget from "components/Dashboard/RevenueChartWidget";
import SessionCountChartWidget from "components/Dashboard/SessionCountChartWidget";
import StationGrowthChartWidget from "components/Dashboard/StationGrowthChartWidget";
import { selectLayoutHeaderHeight } from "redux/app/layoutSlice";
import { selectAuthRoleIsStaff } from "redux/auth/authSlice";

const Dashboard = () => {
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const headerHeight = useSelector(selectLayoutHeaderHeight);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <StickyContainer style={{ top: `${headerHeight}px` }}>
        <FilterBar onClick={() => setIsFilterModalOpen(true)} />
      </StickyContainer>
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
      {isFilterModalOpen && (
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}
    </CCard>
  )
}

export default Dashboard
