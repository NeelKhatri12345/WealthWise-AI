import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Breadcrumb {
  label: string;
  path: string;
}

export interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  breadcrumbs: Breadcrumb[];
}

const initialState: UIState = {
  sidebarOpen: true,
  activeModal: null,
  breadcrumbs: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },

    openModal(state, action: PayloadAction<string>) {
      state.activeModal = action.payload;
    },
    closeModal(state) {
      state.activeModal = null;
    },
    setBreadcrumbs(state, action: PayloadAction<Breadcrumb[]>) {
      state.breadcrumbs = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  setBreadcrumbs,
} = uiSlice.actions;
export default uiSlice.reducer;
