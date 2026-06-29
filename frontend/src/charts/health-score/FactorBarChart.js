import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getFactorBarOptions } from './chartOptions';
const FactorBarChart = ({ data, height = 300, loading, error, className, }) => {
    const options = getFactorBarOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default FactorBarChart;
