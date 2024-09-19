import ChartWidgetContainer from "components/ChartWidgetContainer";

const DriverGrowthChartWidget = ({ className = "", style = {}, data }) => (
  <ChartWidgetContainer
    className={className}
    style={style}
    label="Drivers"
    chart={{
      type: "line",
      data: data,
      options: {
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
        elements: {
          line: {
            borderWidth: 2,
            tension: 0.3,
          },
          point: {
            hitRadius: 10,
          },
        },
      },
    }}
  />
);

export default DriverGrowthChartWidget;
