import React from 'react';
import { CChart } from '@coreui/react-chartjs';

const BarChart = ({ data }) => {
    const chartData = {
        labels: data.map(item => item.date),
        datasets: [
            {
                label: 'Daily Revenue',
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1,
                data: data.map(item => item.revenue)
            }
        ]
    };

    const options = {
        // Customize your chart options here
    };

    return <CChart type="bar" datasets={chartData.datasets} labels={chartData.labels} options={options} />;
};

export default BarChart;
