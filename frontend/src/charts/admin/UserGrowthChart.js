import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getUserGrowthOptions } from './chartOptions';
const UserGrowthChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getUserGrowthOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default UserGrowthChart;
