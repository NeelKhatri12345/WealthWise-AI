import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getRiskTrendOptions } from './chartOptions';
const RiskTrendChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getRiskTrendOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default RiskTrendChart;
