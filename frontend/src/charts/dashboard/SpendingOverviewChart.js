import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getSpendingOverviewOptions, } from './chartOptions';
const SpendingOverviewChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getSpendingOverviewOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default SpendingOverviewChart;
