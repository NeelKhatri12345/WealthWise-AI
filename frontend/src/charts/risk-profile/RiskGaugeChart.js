import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getRiskGaugeOptions } from './chartOptions';
const RiskGaugeChart = ({ data, height = 300, loading, error, className, }) => {
    const options = getRiskGaugeOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default RiskGaugeChart;
