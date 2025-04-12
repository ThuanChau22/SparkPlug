import { useMemo, useState } from "react";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardTitle,
  CProgress,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";

const DriverStatusWidget = ({ className = "" }) => {
  const [loading] = useState(false);

  const driverStatusData = useMemo(() => {
    const data = {
      SessionCount: {
        label: "Session Count",
        color: "info",
        count: 0,
        percentage: 0,
      },
      TotalPaid: {
        label: "Total Paid",
        color: "success",
        count: 0,
        percentage: 0,
      },
      VoltageCharge: {
        label: "Total Voltage Charged",
        color: "warning",
        count: 0,
        percentage: 0,
      },
      ChargedTime: {
        label: "Total Charged Time",
        color: "danger",
        count: 0,
        percentage: 0,
      },
      VisitedStations: {
        label: "Station Visited",
        color: "secondary",
        count: 0,
        percentage: 0,
      },
    };
    return data;
  }, []);

  return (
    <CCard className={className}>
      <CCardBody>
        <CCardTitle as="div" className="fs-4 fw-semibold">
          Driver Status
        </CCardTitle>
        {loading
          ? <LoadingIndicator size={60} loading={loading} />
          : (
            <CRow
              className="d-flex justify-content-evenly mb-1"
              xs={{ cols: 1, gutter: 2 }}
            >
              {Object.values(driverStatusData).map(({ label, color, count, percentage }) => (
                <CCol key={label} sm={label === driverStatusData.Total.label ? 12 : 6} md={2}>
                  <div className="fw-semibold text-center mb-2">
                    <span className={`d-block text-${color}`}>{label}</span>
                    <span className="d-block">{count} ({percentage.toFixed(2)}%)</span>
                  </div>
                  <CProgress height={6} color={color} value={percentage} />
                </CCol>
              ))}
            </CRow>
          )
        }
      </CCardBody>
    </CCard>
  );
}

export default DriverStatusWidget;
