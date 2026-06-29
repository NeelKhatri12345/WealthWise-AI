import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getSavingsRateOptions } from './chartOptions';
const SavingsRateChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getSavingsRateOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default SavingsRateChart;
