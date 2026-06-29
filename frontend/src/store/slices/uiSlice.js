import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    sidebarOpen: true,
    theme: localStorage.getItem('theme') ?? 'light',
    activeModal: null,
    breadcrumbs: [],
};
const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar(state) {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen(state, action) {
            state.sidebarOpen = action.payload;
        },
        setTheme(state, action) {
            state.theme = action.payload;
            localStorage.setItem('theme', action.payload);
        },
        openModal(state, action) {
            state.activeModal = action.payload;
        },
        closeModal(state) {
            state.activeModal = null;
        },
        setBreadcrumbs(state, action) {
            state.breadcrumbs = action.payload;
        },
    },
});
export const { toggleSidebar, setSidebarOpen, setTheme, openModal, closeModal, setBreadcrumbs, } = uiSlice.actions;
export default uiSlice.reducer;
