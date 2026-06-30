export interface Breadcrumb {
  label: string;
  path: string;
}
export interface UIState {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  activeModal: string | null;
  breadcrumbs: Breadcrumb[];
}
export declare const toggleSidebar: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/toggleSidebar">,
  setSidebarOpen: import("@reduxjs/toolkit").ActionCreatorWithPayload<
    boolean,
    "ui/setSidebarOpen"
  >,
  setTheme: import("@reduxjs/toolkit").ActionCreatorWithPayload<
    "light" | "dark" | "system",
    "ui/setTheme"
  >,
  openModal: import("@reduxjs/toolkit").ActionCreatorWithPayload<
    string,
    "ui/openModal"
  >,
  closeModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/closeModal">,
  setBreadcrumbs: import("@reduxjs/toolkit").ActionCreatorWithPayload<
    Breadcrumb[],
    "ui/setBreadcrumbs"
  >;
declare const _default: import("redux").Reducer<UIState>;
export default _default;
