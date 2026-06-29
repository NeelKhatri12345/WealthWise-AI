import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
const initialState = {
    profile: null,
    factors: [],
    assessment: [],
    history: [],
    loading: false,
    error: null,
};
export const fetchRiskProfile = createAsyncThunk('riskProfile/fetchProfile', async (_, { rejectWithValue }) => {
    try {
        const { riskApi } = await import('../../services/api/risk.api');
        const [profile, factors, history] = await Promise.all([
            riskApi.getRiskProfile(),
            riskApi.getRiskFactors(),
            riskApi.getRiskHistory(),
        ]);
        return { profile, factors, history };
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch risk profile');
    }
});
export const submitAssessment = createAsyncThunk('riskProfile/submitAssessment', async (answers, { rejectWithValue }) => {
    try {
        const { riskApi } = await import('../../services/api/risk.api');
        return await riskApi.submitAssessment(answers);
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Failed to submit assessment');
    }
});
const riskProfileSlice = createSlice({
    name: 'riskProfile',
    initialState,
    reducers: {
        clearRiskError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRiskProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(fetchRiskProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.profile = action.payload.profile;
            state.factors = action.payload.factors;
            state.history = action.payload.history;
        })
            .addCase(fetchRiskProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
            .addCase(submitAssessment.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(submitAssessment.fulfilled, (state, action) => {
            state.loading = false;
            state.profile = action.payload;
        })
            .addCase(submitAssessment.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});
export const { clearRiskError } = riskProfileSlice.actions;
export default riskProfileSlice.reducer;
