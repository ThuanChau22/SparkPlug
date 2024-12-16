import { CWidgetStatsA } from "@coreui/react";
import { CChart } from "@coreui/react-chartjs";

import LoadingIndicator from "components/LoadingIndicator";

/**
 * chart.type: "line"|"bar"|"radar"|"doughnut"|"polarArea"|"bubble"|"pie"|"scatter"
 */
const ChartWidgetContainer = ({ className = "", style = {}, label = "", chart = {} }) => (
  <CWidgetStatsA
    className="shadow-sm"
    value={label}
    chart={
      <div
        className={`m-3 mt-2${className ? ` ${className}` : ""}`}
        style={{ height: "150px", ...style }}
      >
        {!chart.data
          ? <LoadingIndicator loading={!chart.data} />
          : chart.data?.length !== 0
            ? <CChart customTooltips={false} {...chart} />
            : (
              <span className="d-flex justify-content-center align-items-center h-100">
                Data not available
              </span>
            )
        }
      </div>
    }
  />
);

export default ChartWidgetContainer;
