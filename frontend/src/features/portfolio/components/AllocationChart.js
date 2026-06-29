import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
export const AllocationChart = ({ data, title = 'Portfolio Allocation' }) => {
    const chartRef = useRef(null);
    useEffect(() => {
        if (!chartRef.current || data.length === 0)
            return;
        const chart = Highcharts.chart(chartRef.current, {
            chart: { type: 'pie', height: 320 },
            title: { text: undefined },
            tooltip: {
                pointFormat: '{point.percentage:.1f}% (${point.value:,.0f})',
            },
            plotOptions: {
                pie: {
                    innerSize: '60%',
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f}%',
                    },
                },
            },
            series: [
                {
                    name: 'Allocation',
                    type: 'pie',
                    data: data.map((d) => ({
                        name: d.name,
                        y: d.percentage,
                        value: d.value,
                        color: d.color,
                    })),
                },
            ],
            credits: { enabled: false },
        });
        return () => {
            chart.destroy();
        };
    }, [data]);
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: title }), data.length === 0 ? (_jsx("p", { className: "py-8 text-center text-sm text-gray-500", children: "No allocation data available" })) : (_jsx("div", { ref: chartRef }))] }));
};
