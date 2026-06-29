interface GeneralSettingsProps {
    language: string;
    currency: string;
    dateFormat: string;
    onUpdate: (settings: {
        language: string;
        currency: string;
        dateFormat: string;
    }) => void;
}
export declare const GeneralSettings: ({ language, currency, dateFormat, onUpdate }: GeneralSettingsProps) => import("react").JSX.Element;
export {};
