import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getScoreGaugeOptions } from './chartOptions';
const ScoreGaugeChart = ({ data, height = 300, loading, error, className, }) => {
    const options = getScoreGaugeOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default ScoreGaugeChart;
