import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import settingsService, { UserPreferences, UserProfile } from '../../services/settingsService';

// Types
interface SettingsState {
  userProfile: UserProfile | null;
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: SettingsState = {
  userProfile: null,
  preferences: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'settings/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsService.getUserProfile();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'settings/updateUserProfile',
  async (data: Partial<UserProfile>, { rejectWithValue }) => {
    try {
      const response = await settingsService.updateUserProfile(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update user profile');
    }
  }
);

export const fetchUserPreferences = createAsyncThunk(
  'settings/fetchUserPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsService.getUserPreferences();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user preferences');
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'settings/updateUserPreferences',
  async (data: Partial<UserPreferences>, { rejectWithValue }) => {
    try {
      const response = await settingsService.updateUserPreferences(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update user preferences');
    }
  }
);

export const changePassword = createAsyncThunk(
  'settings/changePassword',
  async (data: { current_password: string; new_password: string }, { rejectWithValue }) => {
    try {
      const response = await settingsService.changePassword(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to change password');
    }
  }
);

// Create slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearSettingsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch user profile
    builder.addCase(fetchUserProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
      state.loading = false;
      state.userProfile = action.payload;
    });
    builder.addCase(fetchUserProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update user profile
    builder.addCase(updateUserProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
      state.loading = false;
      state.userProfile = action.payload;
    });
    builder.addCase(updateUserProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch user preferences
    builder.addCase(fetchUserPreferences.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserPreferences.fulfilled, (state, action: PayloadAction<UserPreferences>) => {
      state.loading = false;
      state.preferences = action.payload;
    });
    builder.addCase(fetchUserPreferences.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update user preferences
    builder.addCase(updateUserPreferences.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUserPreferences.fulfilled, (state, action: PayloadAction<UserPreferences>) => {
      state.loading = false;
      state.preferences = action.payload;
    });
    builder.addCase(updateUserPreferences.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Change password
    builder.addCase(changePassword.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(changePassword.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(changePassword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearSettingsError } = settingsSlice.actions;

export default settingsSlice.reducer;