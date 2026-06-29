import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
export const CategoryBreakdown = ({ data, title = 'Spending by Category' }) => {
    const chartRef = useRef(null);
    useEffect(() => {
        if (!chartRef.current || data.length === 0)
            return;
        const chart = Highcharts.chart(chartRef.current, {
            chart: { type: 'pie', height: 300 },
            title: { text: undefined },
            tooltip: {
                pointFormat: '<b>${point.y:,.0f}</b> ({point.percentage:.1f}%)',
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}: {point.percentage:.1f}%',
                    },
                },
            },
            series: [
                {
                    name: 'Spending',
                    type: 'pie',
                    data: data.map((d) => ({
                        name: d.name,
                        y: d.amount,
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
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: title }), data.length === 0 ? (_jsx("p", { className: "py-8 text-center text-sm text-gray-500", children: "No category data available" })) : (_jsx("div", { ref: chartRef }))] }));
};
