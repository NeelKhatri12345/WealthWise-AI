interface ApiEndpoint {
    path: string;
    method: string;
    avgResponseTime: number;
    requestCount: number;
    errorRate: number;
    status: 'healthy' | 'degraded' | 'down';
}
interface ApiMonitorProps {
    endpoints: ApiEndpoint[];
}
export declare const ApiMonitor: ({ endpoints }: ApiMonitorProps) => import("react").JSX.Element;
export {};
