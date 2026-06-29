import { z } from 'zod';
declare const reportSchema: z.ZodObject<{
    type: z.ZodEnum<["monthly", "quarterly", "annual", "custom"]>;
    dateFrom: z.ZodString;
    dateTo: z.ZodString;
    includeCharts: z.ZodOptional<z.ZodBoolean>;
    includeSummary: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "custom" | "monthly" | "quarterly" | "annual";
    dateFrom: string;
    dateTo: string;
    includeCharts?: boolean | undefined;
    includeSummary?: boolean | undefined;
}, {
    type: "custom" | "monthly" | "quarterly" | "annual";
    dateFrom: string;
    dateTo: string;
    includeCharts?: boolean | undefined;
    includeSummary?: boolean | undefined;
}>;
type ReportFormValues = z.infer<typeof reportSchema>;
interface ReportGeneratorProps {
    onGenerate: (data: ReportFormValues) => void;
    isLoading?: boolean;
}
export declare const ReportGenerator: ({ onGenerate, isLoading }: ReportGeneratorProps) => import("react").JSX.Element;
export {};
