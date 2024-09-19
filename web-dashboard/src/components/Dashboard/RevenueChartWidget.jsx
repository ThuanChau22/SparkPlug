import ChartWidgetContainer from "components/ChartWidgetContainer";

const RevenueChartWidget = ({ className = "", style = {}, data }) => (
  <ChartWidgetContainer
    className={className}
    style={style}
    label="Revenue"
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
)

export default RevenueChartWidget;
