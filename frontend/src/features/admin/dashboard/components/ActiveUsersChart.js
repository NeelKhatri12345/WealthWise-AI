import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
export const ActiveUsersChart = ({ data }) => {
    const chartRef = useRef(null);
    useEffect(() => {
        if (!chartRef.current || data.length === 0)
            return;
        const chart = Highcharts.chart(chartRef.current, {
            chart: { type: 'areaspline', height: 280 },
            title: { text: undefined },
            xAxis: { categories: data.map((d) => d.time) },
            yAxis: { title: { text: undefined }, min: 0 },
            series: [
                {
                    name: 'Active Users',
                    data: data.map((d) => d.count),
                    color: '#8B5CF6',
                    fillColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, 'rgba(139, 92, 246, 0.3)'],
                            [1, 'rgba(139, 92, 246, 0.0)'],
                        ],
                    },
                    type: 'areaspline',
                },
            ],
            credits: { enabled: false },
            legend: { enabled: false },
        });
        return () => { chart.destroy(); };
    }, [data]);
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: "Active Users" }), data.length === 0 ? (_jsx("p", { className: "py-8 text-center text-sm text-gray-500", children: "No data available" })) : (_jsx("div", { ref: chartRef }))] }));
};
