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
import { selectAuthRoleIsStaff } from "redux/auth/authSlice";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";

const Dashboard = () => {
  const authIsAdmin = useSelector(selectAuthRoleIsStaff);
  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const defaultFilter = {
    startDate: "",
    endDate: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    viewBy: "",
    orderBy: "",
    count: 0,
    interval: "",
  };
  const [filter, setFilter] = useState(defaultFilter);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <StickyContainer style={{ top: `${headerHeight}px` }}>
        <FilterBar
          filter={filter}
          onClick={() => setIsFilterModalOpen(true)}
          onRemove={(field) => setFilter({ ...filter, [field]: "" })}
        />
      </StickyContainer>
      <EvseStatusWidget className="mx-4 mt-3 shadow-sm" />
      <CRow
        className="m-3 mt-0"
        xs={{ cols: 1, gutter: 3 }}
        md={{ cols: 2 }}
        xxl={{ cols: 3 }}
      >
        <CCol>
          <SessionCountChartWidget filter={filter} />
        </CCol>
        <CCol>
          <RevenueChartWidget filter={filter} />
        </CCol>
        <CCol>
          <EnergyConsumptionChartWidget filter={filter} />
        </CCol>
        <CCol>
          <PeakTimeChartWidget filter={filter} />
        </CCol>
        {authIsAdmin && (
          <>
            <CCol>
              <DriverGrowthChartWidget filter={filter} />
            </CCol>
            <CCol>
              <OwnerGrowthChartWidget filter={filter} />
            </CCol>
          </>
        )}
        <CCol>
          <StationGrowthChartWidget filter={filter} />
        </CCol>
      </CRow>
      {isFilterModalOpen && (
        <FilterModal
          filter={filter}
          isOpen={isFilterModalOpen}
          onSubmit={(data) => setFilter(data)}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}
    </CCard>
  )
}

export default Dashboard
