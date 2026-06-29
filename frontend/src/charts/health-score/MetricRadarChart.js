import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getMetricRadarOptions } from './chartOptions';
const MetricRadarChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getMetricRadarOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default MetricRadarChart;
