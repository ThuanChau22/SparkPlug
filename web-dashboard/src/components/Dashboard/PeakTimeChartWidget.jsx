import ChartWidgetContainer from "components/ChartWidgetContainer";

const PeakTimeChartWidget = ({ className = "", style = {}, data }) => (
  <ChartWidgetContainer
    className={className}
    style={style}
    label="Peak Time"
    chart={{
      type: "bar",
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
      },
    }}
  />
);

export default PeakTimeChartWidget;
