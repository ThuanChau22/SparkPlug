import ChartWidgetContainer from "components/ChartWidgetContainer";

const StationGrowthChartWidget = ({ className = "", style = {}, data }) => (
  <ChartWidgetContainer
    className={className}
    style={style}
    label="Stations"
    chart={{
      type: "bar",
      data: data,
      options: {
        indexAxis: "y",
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            grid: {
              drawTicks: false,
            },
          },
          y: {
            grid: {
              drawTicks: false,
            },
          },
        },
      },
    }}
  />
);

export default StationGrowthChartWidget;
