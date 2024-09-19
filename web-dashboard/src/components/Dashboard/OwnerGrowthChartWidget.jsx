import ChartWidgetContainer from "components/ChartWidgetContainer";

const OwnerGrowthChartWidget = ({ className = "", style = {}, data }) => (
  <ChartWidgetContainer
    className={className}
    style={style}
    label="Owners"
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
            borderWidth: 1,
          },
          point: {
            radius: 4,
            hitRadius: 10,
            hoverRadius: 4,
          },
        },
      },
    }}
  />
);

export default OwnerGrowthChartWidget;
