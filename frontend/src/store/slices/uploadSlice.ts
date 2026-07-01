/**
 * WealthWise AI — Upload Redux Slice
 *
 * State:
 *   selectedFile      – File chosen by the user (held in local non-serializable state;
 *                       marked ignored in the store's serializableCheck)
 *   uploadedDocument  – Backend response after a successful upload
 *   uploadProgress    – 0-100 integer reported by axios onUploadProgress
 *   isUploading       – true while the HTTP request is in flight
 *   uploadSuccess     – true once the upload has completed successfully
 *   error             – string error message on failure, null otherwise
 *
 * Async thunks:
 *   uploadStatement(file)  – calls uploadService.uploadStatement
 *   fetchStatements()      – calls uploadService.listStatements
 */

import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { UploadedDocument, StatementDetail } from "@/services/api/upload.api";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface UploadState {
  /** The File object the user has selected (non-serializable — ignored by middleware). */
  selectedFile: File | null;
  /** Metadata returned by the backend after a successful upload. */
  uploadedDocument: UploadedDocument | null;
  /** 0–100 integer progress from axios onUploadProgress. */
  uploadProgress: number;
  /** True while the upload HTTP request is in flight. */
  isUploading: boolean;
  /** True once the upload has completed successfully. */
  uploadSuccess: boolean;
  /** Human-readable error message; null when there is no error. */
  error: string | null;
  /** Previously uploaded statements for the current user. */
  statements: StatementDetail[];
  /** True while fetching the statement list. */
  isFetchingStatements: boolean;
}

const initialState: UploadState = {
  selectedFile: null,
  uploadedDocument: null,
  uploadProgress: 0,
  isUploading: false,
  uploadSuccess: false,
  error: null,
  statements: [],
  isFetchingStatements: false,
};

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

/**
 * Upload a bank statement file to the backend.
 *
 * Dispatches progress updates via setUploadProgress during the transfer.
 * On success, stores the UploadedDocument in state.uploadedDocument.
 */
export const uploadStatement = createAsyncThunk<
  UploadedDocument,
  File,
  { rejectValue: string }
>(
  "upload/uploadStatement",
  async (file, { dispatch, rejectWithValue }) => {
    try {
      const { uploadService } = await import("@/services/api/upload.api");
      const result = await uploadService.uploadStatement(file, (percent) => {
        dispatch(setUploadProgress(percent));
      });
      return result;
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        axiosErr.response?.data?.message ??
        axiosErr.message ??
        "Upload failed. Please try again.";
      return rejectWithValue(message);
    }
  },
);

/**
 * Fetch the list of statements uploaded by the current user.
 */
export const fetchStatements = createAsyncThunk<
  StatementDetail[],
  void,
  { rejectValue: string }
>(
  "upload/fetchStatements",
  async (_, { rejectWithValue }) => {
    try {
      const { uploadService } = await import("@/services/api/upload.api");
      return await uploadService.listStatements();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        axiosErr.response?.data?.message ??
        axiosErr.message ??
        "Failed to fetch statements.";
      return rejectWithValue(message);
    }
  },
);

/**
 * Delete a statement by ID.
 */
export const deleteStatement = createAsyncThunk<
  string,        // fulfilled payload = the deleted ID
  string,        // argument = statement ID
  { rejectValue: string }
>(
  "upload/deleteStatement",
  async (id, { rejectWithValue }) => {
    try {
      const { uploadService } = await import("@/services/api/upload.api");
      await uploadService.deleteStatement(id);
      return id;
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        axiosErr.response?.data?.message ??
        axiosErr.message ??
        "Failed to delete statement.";
      return rejectWithValue(message);
    }
  },
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    /** Store the file the user selected (from drop or browse). */
    setSelectedFile(state, action: PayloadAction<File | null>) {
      state.selectedFile = action.payload;
      // Clear any previous upload result when a new file is picked
      state.uploadedDocument = null;
      state.uploadSuccess = false;
      state.error = null;
      state.uploadProgress = 0;
    },

    /** Update the upload progress bar (0–100). */
    setUploadProgress(state, action: PayloadAction<number>) {
      state.uploadProgress = action.payload;
    },

    /** Remove the selected file and reset all upload state. */
    clearUpload(state) {
      state.selectedFile = null;
      state.uploadedDocument = null;
      state.uploadProgress = 0;
      state.isUploading = false;
      state.uploadSuccess = false;
      state.error = null;
    },

    /** Dismiss the error without resetting the rest of the state. */
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── uploadStatement ──────────────────────────────────────────────────────
    builder
      .addCase(uploadStatement.pending, (state) => {
        state.isUploading = true;
        state.uploadSuccess = false;
        state.uploadProgress = 0;
        state.error = null;
        state.uploadedDocument = null;
      })
      .addCase(uploadStatement.fulfilled, (state, action) => {
        state.isUploading = false;
        state.uploadSuccess = true;
        state.uploadProgress = 100;
        state.uploadedDocument = action.payload;
        // Prepend to list if we already have statements loaded
        state.statements.unshift(action.payload as unknown as StatementDetail);
      })
      .addCase(uploadStatement.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 0;
        state.error = action.payload ?? "Upload failed.";
      });

    // ── fetchStatements ──────────────────────────────────────────────────────
    builder
      .addCase(fetchStatements.pending, (state) => {
        state.isFetchingStatements = true;
        state.error = null;
      })
      .addCase(fetchStatements.fulfilled, (state, action) => {
        state.isFetchingStatements = false;
        state.statements = action.payload;
      })
      .addCase(fetchStatements.rejected, (state, action) => {
        state.isFetchingStatements = false;
        state.error = action.payload ?? "Failed to fetch statements.";
      });

    // ── deleteStatement ──────────────────────────────────────────────────────
    builder
      .addCase(deleteStatement.fulfilled, (state, action) => {
        state.statements = state.statements.filter(
          (s) => s.id !== action.payload,
        );
      })
      .addCase(deleteStatement.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to delete statement.";
      });
  },
});

export const { setSelectedFile, setUploadProgress, clearUpload, clearError } =
  uploadSlice.actions;

export default uploadSlice.reducer;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

import type { RootState } from "@/store";

export const selectSelectedFile = (state: RootState) =>
  state.upload.selectedFile;
export const selectUploadedDocument = (state: RootState) =>
  state.upload.uploadedDocument;
export const selectUploadProgress = (state: RootState) =>
  state.upload.uploadProgress;
export const selectIsUploading = (state: RootState) =>
  state.upload.isUploading;
export const selectUploadSuccess = (state: RootState) =>
  state.upload.uploadSuccess;
export const selectUploadError = (state: RootState) => state.upload.error;
export const selectStatements = (state: RootState) =>
  state.upload.statements;
