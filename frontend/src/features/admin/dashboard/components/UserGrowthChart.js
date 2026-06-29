import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
export const UserGrowthChart = ({ data }) => {
    const chartRef = useRef(null);
    useEffect(() => {
        if (!chartRef.current || data.length === 0)
            return;
        const chart = Highcharts.chart(chartRef.current, {
            chart: { type: 'column', height: 300 },
            title: { text: undefined },
            xAxis: { categories: data.map((d) => d.date) },
            yAxis: [
                { title: { text: 'New Users' } },
                { title: { text: 'Total Users' }, opposite: true },
            ],
            series: [
                { name: 'New Users', data: data.map((d) => d.newUsers), type: 'column', color: '#6366F1' },
                { name: 'Total Users', data: data.map((d) => d.totalUsers), type: 'spline', yAxis: 1, color: '#10B981' },
            ],
            credits: { enabled: false },
        });
        return () => { chart.destroy(); };
    }, [data]);
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: "User Growth" }), data.length === 0 ? (_jsx("p", { className: "py-8 text-center text-sm text-gray-500", children: "No data available" })) : (_jsx("div", { ref: chartRef }))] }));
};
