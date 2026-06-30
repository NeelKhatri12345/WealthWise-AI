interface ConfigItem {
  key: string;
  label: string;
  value: string;
  type: "text" | "number" | "select";
  options?: string[];
  description?: string;
}
interface SystemConfigProps {
  configs: ConfigItem[];
  onUpdate: (key: string, value: string) => void;
  onSave: () => void;
  isLoading?: boolean;
}
export declare const SystemConfig: ({
  configs,
  onUpdate,
  onSave,
  isLoading,
}: SystemConfigProps) => import("react").JSX.Element;
export {};
