import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getErrorRateOptions } from './chartOptions';
const ErrorRateChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getErrorRateOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default ErrorRateChart;
