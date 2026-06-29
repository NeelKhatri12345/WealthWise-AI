import { CHART_COLORS } from '../common/chartColors';
export function getScoreGaugeOptions(data) {
    const max = data.maxScore ?? 100;
    const pct = (data.score / max) * 100;
    let color = CHART_COLORS.gauge.low;
    if (pct >= 70)
        color = CHART_COLORS.gauge.high;
    else if (pct >= 40)
        color = CHART_COLORS.gauge.medium;
    return {
        chart: { type: 'solidgauge' },
        title: { text: undefined },
        pane: {
            center: ['50%', '70%'],
            size: '120%',
            startAngle: -120,
            endAngle: 120,
            background: [
                {
                    backgroundColor: `${CHART_COLORS.border}80`,
                    innerRadius: '75%',
                    outerRadius: '100%',
                    shape: 'arc',
                    borderWidth: 0,
                },
            ],
        },
        yAxis: {
            min: 0,
            max,
            lineWidth: 0,
            tickWidth: 0,
            minorTickLength: 0,
            tickAmount: 0,
            labels: { enabled: false },
            stops: [
                [0.3, CHART_COLORS.gauge.low],
                [0.6, CHART_COLORS.gauge.medium],
                [0.8, CHART_COLORS.gauge.high],
            ],
        },
        tooltip: { enabled: false },
        plotOptions: {
            solidgauge: {
                innerRadius: '75%',
                dataLabels: {
                    y: -30,
                    borderWidth: 0,
                    useHTML: true,
                    format: `<div style="text-align:center"><span style="font-size:2rem;font-weight:700;color:${color}">{y}</span><br/><span style="font-size:0.8rem;color:${CHART_COLORS.text.secondary}">${data.label ?? 'Health Score'}</span></div>`,
                },
            },
        },
        series: [
            {
                name: 'Score',
                type: 'solidgauge',
                data: [data.score],
                color,
            },
        ],
    };
}
export function getScoreHistoryOptions(data) {
    return {
        chart: { type: 'spline' },
        title: { text: undefined },
        xAxis: { categories: data.categories },
        yAxis: {
            title: { text: 'Health Score' },
            min: 0,
            max: 100,
            plotBands: [
                { from: 0, to: 40, color: `${CHART_COLORS.gauge.low}15`, label: { text: 'Poor', style: { fontSize: '10px', color: CHART_COLORS.text.muted } } },
                { from: 40, to: 70, color: `${CHART_COLORS.gauge.medium}10`, label: { text: 'Fair', style: { fontSize: '10px', color: CHART_COLORS.text.muted } } },
                { from: 70, to: 100, color: `${CHART_COLORS.gauge.high}10`, label: { text: 'Good', style: { fontSize: '10px', color: CHART_COLORS.text.muted } } },
            ],
        },
        tooltip: {
            formatter() {
                const point = this;
                return `<b>${point.x}</b><br/>Score: <b>${point.y}</b>`;
            },
        },
        series: [
            {
                name: 'Health Score',
                type: 'spline',
                data: data.scores,
                color: CHART_COLORS.primary,
                marker: { enabled: true, radius: 4 },
            },
        ],
    };
}
export function getMetricRadarOptions(data) {
    return {
        chart: { polar: true, type: 'line' },
        title: { text: undefined },
        pane: { size: '80%' },
        xAxis: {
            categories: data.categories,
            tickmarkPlacement: 'on',
            lineWidth: 0,
        },
        yAxis: {
            gridLineInterpolation: 'polygon',
            lineWidth: 0,
            min: 0,
            max: data.maxValue ?? 100,
        },
        tooltip: {
            pointFormat: '<b>{point.y}</b> / {series.yAxis.max}',
        },
        series: [
            {
                name: 'Metrics',
                type: 'line',
                data: data.values,
                pointPlacement: 'on',
                color: CHART_COLORS.primary,
                fillOpacity: 0.2,
            },
        ],
        legend: { enabled: false },
    };
}
export function getFactorBarOptions(data) {
    return {
        chart: { type: 'bar' },
        title: { text: undefined },
        xAxis: {
            categories: data.factors.map((f) => f.name),
            lineWidth: 0,
        },
        yAxis: {
            title: { text: 'Contribution' },
            min: 0,
            max: 100,
            labels: { format: '{value}%' },
        },
        tooltip: {
            pointFormat: 'Contribution: <b>{point.y}%</b>',
        },
        plotOptions: {
            bar: { borderRadius: 4, pointWidth: 20 },
        },
        legend: { enabled: false },
        series: [
            {
                name: 'Factor',
                type: 'bar',
                data: data.factors.map((f, i) => ({
                    y: f.value,
                    color: f.color ?? CHART_COLORS.categorical[i % CHART_COLORS.categorical.length],
                })),
            },
        ],
    };
}
