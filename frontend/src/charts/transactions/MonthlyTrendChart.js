import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getMonthlyTrendOptions } from './chartOptions';
const MonthlyTrendChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getMonthlyTrendOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default MonthlyTrendChart;
