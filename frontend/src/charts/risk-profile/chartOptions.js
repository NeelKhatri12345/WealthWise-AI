import { CHART_COLORS } from '../common/chartColors';
export function getRiskGaugeOptions(data) {
    const max = data.maxScore ?? 100;
    const pct = (data.score / max) * 100;
    let color = CHART_COLORS.gauge.high;
    if (pct >= 70)
        color = CHART_COLORS.gauge.low;
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
                [0.3, CHART_COLORS.gauge.high],
                [0.6, CHART_COLORS.gauge.medium],
                [0.8, CHART_COLORS.gauge.low],
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
                    format: `<div style="text-align:center"><span style="font-size:2rem;font-weight:700;color:${color}">{y}</span><br/><span style="font-size:0.8rem;color:${CHART_COLORS.text.secondary}">${data.riskLevel ?? 'Risk Score'}</span></div>`,
                },
            },
        },
        series: [
            {
                name: 'Risk',
                type: 'solidgauge',
                data: [data.score],
                color,
            },
        ],
    };
}
export function getRiskFactorOptions(data) {
    return {
        chart: { polar: true, type: 'column' },
        title: { text: undefined },
        pane: { size: '85%' },
        xAxis: {
            categories: data.categories,
            tickmarkPlacement: 'on',
        },
        yAxis: {
            min: 0,
            max: 100,
            gridLineInterpolation: 'polygon',
            labels: { format: '{value}%' },
        },
        tooltip: {
            pointFormat: '<b>{point.y}%</b>',
        },
        plotOptions: {
            column: {
                pointPadding: 0,
                groupPadding: 0,
                borderRadius: 2,
            },
        },
        legend: { enabled: false },
        series: [
            {
                name: 'Risk Factor',
                type: 'column',
                data: data.values.map((v, i) => ({
                    y: v,
                    color: CHART_COLORS.categorical[i % CHART_COLORS.categorical.length],
                })),
            },
        ],
    };
}
export function getRiskTrendOptions(data) {
    return {
        chart: { type: 'line' },
        title: { text: undefined },
        xAxis: { categories: data.categories },
        yAxis: {
            title: { text: 'Risk Score' },
            min: 0,
            max: 100,
            plotBands: [
                { from: 0, to: 30, color: `${CHART_COLORS.gauge.high}10`, label: { text: 'Low Risk', style: { fontSize: '10px', color: CHART_COLORS.text.muted } } },
                { from: 30, to: 70, color: `${CHART_COLORS.gauge.medium}10`, label: { text: 'Moderate', style: { fontSize: '10px', color: CHART_COLORS.text.muted } } },
                { from: 70, to: 100, color: `${CHART_COLORS.gauge.low}10`, label: { text: 'High Risk', style: { fontSize: '10px', color: CHART_COLORS.text.muted } } },
            ],
        },
        tooltip: {
            formatter() {
                const point = this;
                return `<b>${point.x}</b><br/>Risk Score: <b>${point.y}</b>`;
            },
        },
        series: [
            {
                name: 'Risk Score',
                type: 'line',
                data: data.scores,
                color: CHART_COLORS.danger,
                marker: { enabled: true, radius: 4 },
            },
        ],
    };
}
export function getBenchmarkComparisonOptions(data) {
    return {
        chart: { type: 'column' },
        title: { text: undefined },
        xAxis: { categories: data.categories, crosshair: true },
        yAxis: {
            title: { text: 'Score' },
            min: 0,
        },
        tooltip: {
            shared: true,
        },
        plotOptions: {
            column: { groupPadding: 0.15, pointPadding: 0.05 },
        },
        series: [
            {
                name: 'Your Score',
                type: 'column',
                data: data.userValues,
                color: CHART_COLORS.primary,
            },
            {
                name: 'Benchmark',
                type: 'column',
                data: data.benchmarkValues,
                color: CHART_COLORS.text.muted,
            },
        ],
    };
}
