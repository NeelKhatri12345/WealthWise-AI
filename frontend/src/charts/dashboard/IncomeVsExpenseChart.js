import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getIncomeVsExpenseOptions, } from './chartOptions';
const IncomeVsExpenseChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getIncomeVsExpenseOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default IncomeVsExpenseChart;
