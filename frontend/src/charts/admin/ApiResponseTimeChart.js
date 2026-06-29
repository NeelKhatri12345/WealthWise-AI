import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getApiResponseTimeOptions, } from './chartOptions';
const ApiResponseTimeChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getApiResponseTimeOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default ApiResponseTimeChart;
