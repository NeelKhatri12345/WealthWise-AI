import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getPerformanceLineOptions, } from './chartOptions';
const PerformanceLineChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getPerformanceLineOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default PerformanceLineChart;
