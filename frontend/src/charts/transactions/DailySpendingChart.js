import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getDailySpendingOptions, } from './chartOptions';
const DailySpendingChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getDailySpendingOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default DailySpendingChart;
