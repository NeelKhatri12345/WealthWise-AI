import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
const initialState = {
    uploadProgress: 0,
    uploadHistory: [],
    currentFile: null,
    status: 'idle',
    error: null,
};
export const uploadFile = createAsyncThunk('upload/uploadFile', async (file, { dispatch, rejectWithValue }) => {
    try {
        const { uploadApi } = await import('../../services/api/upload.api');
        dispatch(uploadSlice.actions.setCurrentFile(file));
        const response = await uploadApi.uploadStatement(file, (progress) => {
            dispatch(uploadSlice.actions.setUploadProgress(progress));
        });
        return response;
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Upload failed');
    }
});
export const fetchUploadHistory = createAsyncThunk('upload/fetchHistory', async (_, { rejectWithValue }) => {
    try {
        const { uploadApi } = await import('../../services/api/upload.api');
        return await uploadApi.getUploadHistory();
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch upload history');
    }
});
const uploadSlice = createSlice({
    name: 'upload',
    initialState,
    reducers: {
        setUploadProgress(state, action) {
            state.uploadProgress = action.payload;
        },
        setCurrentFile(state, action) {
            state.currentFile = action.payload;
        },
        clearUpload(state) {
            state.uploadProgress = 0;
            state.currentFile = null;
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(uploadFile.pending, (state) => {
            state.status = 'uploading';
            state.uploadProgress = 0;
            state.error = null;
        })
            .addCase(uploadFile.fulfilled, (state, action) => {
            state.status = 'completed';
            state.uploadProgress = 100;
            state.uploadHistory.unshift(action.payload);
        })
            .addCase(uploadFile.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        })
            .addCase(fetchUploadHistory.pending, (state) => {
            state.error = null;
        })
            .addCase(fetchUploadHistory.fulfilled, (state, action) => {
            state.uploadHistory = action.payload;
        })
            .addCase(fetchUploadHistory.rejected, (state, action) => {
            state.error = action.payload;
        });
    },
});
export const { setUploadProgress, setCurrentFile, clearUpload } = uploadSlice.actions;
export default uploadSlice.reducer;
