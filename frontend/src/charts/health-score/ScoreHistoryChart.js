import { jsx as _jsx } from "react/jsx-runtime";
import BaseChart from '../common/BaseChart';
import { getScoreHistoryOptions, } from './chartOptions';
const ScoreHistoryChart = ({ data, height = 350, loading, error, className, }) => {
    const options = getScoreHistoryOptions(data);
    return (_jsx(BaseChart, { options: options, height: height, loading: loading, error: error, className: className }));
};
export default ScoreHistoryChart;
