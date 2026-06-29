import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getCategoryPieOptions } from './chartOptions';
const CategoryPieChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getCategoryPieOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default CategoryPieChart;
