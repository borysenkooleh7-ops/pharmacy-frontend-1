import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { PharmacySubmission, ApiResponse, PaginatedResponse, PaginationParams, PaginationState } from './types'
import { apiService, API_CONFIG } from '../../config/api'

interface SubmissionsState {
  submissions: PharmacySubmission[]
  loading: boolean
  error: string | null
  selectedSubmission: PharmacySubmission | null
  pagination: PaginationState
}

const initialState: SubmissionsState = {
  submissions: [],
  loading: false,
  error: null,
  selectedSubmission: null,
  pagination: {
    currentPage: API_CONFIG.DEFAULT_PAGINATION.page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: API_CONFIG.DEFAULT_PAGINATION.limit,
    hasNextPage: false,
    hasPrevPage: false,
  },
}

// Async thunks
export const fetchSubmissions = createAsyncThunk(
  'submissions/fetchSubmissions',
  async (params: PaginationParams = API_CONFIG.DEFAULT_PAGINATION) => {
    return await apiService.fetchPaginated<PharmacySubmission>('/pharmacy-submissions', params)
  }
)

export const updateSubmissionStatus = createAsyncThunk(
  'submissions/updateSubmissionStatus',
  async ({ id, status, review_notes, pharmacy_data }: {
    id: number
    status: 'approved' | 'rejected' | 'reviewed'
    review_notes?: string
    pharmacy_data?: any
  }, { rejectWithValue }) => {
    try {
      return await apiService.updateSubmissionStatus(id, status, review_notes, pharmacy_data)
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update submission status')
    }
  }
)
 

export const deleteSubmission = createAsyncThunk(
  'submissions/deleteSubmission',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiService.delete('/pharmacy-submissions', id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete submission')
    }
  }
)

const submissionsSlice = createSlice({
  name: 'submissions',
  initialState,
  reducers: {
    setSelectedSubmission: (state, action: PayloadAction<PharmacySubmission | null>) => {
      state.selectedSubmission = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch submissions
      .addCase(fetchSubmissions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.loading = false
        state.submissions = action.payload.data
        state.pagination = {
          currentPage: action.payload.meta.pagination.currentPage,
          totalPages: action.payload.meta.pagination.totalPages,
          totalItems: action.payload.meta.pagination.total,
          itemsPerPage: action.payload.meta.pagination.limit,
          hasNextPage: action.payload.meta.pagination.hasNextPage,
          hasPrevPage: action.payload.meta.pagination.hasPrevPage,
        }
      })
      .addCase(fetchSubmissions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch submissions'
      })
      // Update submission status
      .addCase(updateSubmissionStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateSubmissionStatus.fulfilled, (state, action) => {
        state.loading = false
        const index = state.submissions.findIndex(s => s.id === action.payload.id)
        if (index !== -1) {
          state.submissions[index] = action.payload
        }
        if (state.selectedSubmission?.id === action.payload.id) {
          state.selectedSubmission = action.payload
        }
      })
      .addCase(updateSubmissionStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || action.error.message || 'Failed to update submission'
      })
      // Delete submission
      .addCase(deleteSubmission.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteSubmission.fulfilled, (state, action) => {
        state.loading = false
        state.submissions = state.submissions.filter(s => s.id !== action.payload)
        if (state.selectedSubmission?.id === action.payload) {
          state.selectedSubmission = null
        }
        // Update pagination total
        state.pagination.totalItems = Math.max(0, state.pagination.totalItems - 1)
      })
      .addCase(deleteSubmission.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || action.error.message || 'Failed to delete submission'
      })
  },
})

export const { setSelectedSubmission, clearError } = submissionsSlice.actions
export default submissionsSlice.reducer