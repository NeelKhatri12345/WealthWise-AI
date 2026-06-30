export interface SidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}
export declare const SidebarContext: import("react").Context<
  SidebarContextValue | undefined
>;
