interface FileDropzoneProps {
    onFilesSelected: (files: File[]) => void;
    acceptedFormats?: string[];
    maxSizeMB?: number;
    multiple?: boolean;
}
export declare const FileDropzone: ({ onFilesSelected, acceptedFormats, maxSizeMB, multiple, }: FileDropzoneProps) => import("react").JSX.Element;
export {};
