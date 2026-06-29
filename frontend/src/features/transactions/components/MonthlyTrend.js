import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
export const MonthlyTrend = ({ data, title = 'Monthly Trend' }) => {
    const chartRef = useRef(null);
    useEffect(() => {
        if (!chartRef.current || data.length === 0)
            return;
        const chart = Highcharts.chart(chartRef.current, {
            chart: { type: 'line', height: 300 },
            title: { text: undefined },
            xAxis: {
                categories: data.map((d) => d.month),
                labels: { style: { color: '#6B7280' } },
            },
            yAxis: {
                title: { text: undefined },
                labels: {
                    formatter: function () {
                        return '$' + Highcharts.numberFormat(this.value, 0, '.', ',');
                    },
                },
            },
            series: [
                {
                    name: 'Income',
                    data: data.map((d) => d.income),
                    color: '#10B981',
                    type: 'line',
                },
                {
                    name: 'Expenses',
                    data: data.map((d) => d.expenses),
                    color: '#EF4444',
                    type: 'line',
                },
            ],
            credits: { enabled: false },
        });
        return () => {
            chart.destroy();
        };
    }, [data]);
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: title }), data.length === 0 ? (_jsx("p", { className: "py-8 text-center text-sm text-gray-500", children: "No trend data available" })) : (_jsx("div", { ref: chartRef }))] }));
};
