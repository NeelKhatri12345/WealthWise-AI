import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getSystemLoadOptions } from './chartOptions';
const SystemLoadChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getSystemLoadOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default SystemLoadChart;
