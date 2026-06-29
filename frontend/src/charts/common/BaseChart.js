import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsSolidGauge from 'highcharts/modules/solid-gauge';
import HighchartsTreemap from 'highcharts/modules/treemap';
import { mergeWithDefaults } from './chartDefaults';
HighchartsMore(Highcharts);
HighchartsSolidGauge(Highcharts);
HighchartsTreemap(Highcharts);
const BaseChart = ({ options, type, height = 400, loading = false, error = null, className = '', }) => {
    const chartRef = useRef(null);
    useEffect(() => {
        const chart = chartRef.current?.chart;
        if (chart) {
            if (loading) {
                chart.showLoading('Loading data...');
            }
            else {
                chart.hideLoading();
            }
        }
    }, [loading]);
    useEffect(() => {
        const handleResize = () => {
            chartRef.current?.chart?.reflow();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    if (error) {
        return (_jsx("div", { className: `flex items-center justify-center bg-red-50 border border-red-200 rounded-xl ${className}`, style: { height }, children: _jsxs("div", { className: "text-center px-4", children: [_jsx("svg", { className: "w-10 h-10 text-red-400 mx-auto mb-2", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" }) }), _jsx("p", { className: "text-sm text-red-600 font-medium", children: "Failed to load chart" }), _jsx("p", { className: "text-xs text-red-500 mt-1", children: error })] }) }));
    }
    const mergedOptions = mergeWithDefaults({
        ...options,
        chart: {
            ...options.chart,
            type: type ?? options.chart?.type,
            height,
        },
    });
    return (_jsxs("div", { className: `relative ${className}`, children: [loading && (_jsx("div", { className: "absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-xl", children: _jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 border-3 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" }), _jsx("span", { className: "text-sm text-slate-500", children: "Loading..." })] }) })), _jsx(HighchartsReact, { highcharts: Highcharts, options: mergedOptions, ref: chartRef })] }));
};
export default BaseChart;
