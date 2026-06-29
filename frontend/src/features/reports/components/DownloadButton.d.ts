interface DownloadButtonProps {
    onDownloadPDF?: () => void;
    onDownloadCSV?: () => void;
    isLoading?: boolean;
}
export declare const DownloadButton: ({ onDownloadPDF, onDownloadCSV, isLoading }: DownloadButtonProps) => import("react").JSX.Element;
export {};
