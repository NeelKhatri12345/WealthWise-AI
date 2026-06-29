interface DataExportProps {
    onExportJSON?: () => void;
    onExportCSV?: () => void;
    isExporting?: boolean;
    lastExportDate?: string;
}
export declare const DataExport: ({ onExportJSON, onExportCSV, isExporting, lastExportDate, }: DataExportProps) => import("react").JSX.Element;
export {};
