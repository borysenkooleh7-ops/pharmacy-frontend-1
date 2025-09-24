import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Pharmacy, ApiResponse, PaginatedResponse, PaginationParams, PaginationState } from './types'
import { apiService, API_CONFIG } from '../../config/api'

interface PharmaciesState {
  pharmacies: Pharmacy[]
  loading: boolean
  error: string | null
  selectedPharmacy: Pharmacy | null
  pagination: PaginationState
}

const initialState: PharmaciesState = {
  pharmacies: [],
  loading: false,
  error: null,
  selectedPharmacy: null,
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
export const fetchPharmacies = createAsyncThunk(
  'pharmacies/fetchPharmacies',
  async (params: PaginationParams = API_CONFIG.DEFAULT_PAGINATION) => {
    return await apiService.fetchPaginated<Pharmacy>('/pharmacies', params)
  }
)

export const createPharmacy = createAsyncThunk(
  'pharmacies/createPharmacy',
  async (pharmacyData: Omit<Pharmacy, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const data = await apiService.create<Pharmacy>('/pharmacies', pharmacyData)
      return data.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create pharmacy')
    }
  }
)

export const updatePharmacy = createAsyncThunk(
  'pharmacies/updatePharmacy',
  async ({ id, ...pharmacyData }: Partial<Pharmacy> & { id: number }, { rejectWithValue }) => {
    try {
      const data = await apiService.update<Pharmacy>('/pharmacies', id, pharmacyData)
      return data.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update pharmacy')
    }
  }
)

export const deletePharmacy = createAsyncThunk(
  'pharmacies/deletePharmacy',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiService.delete('/pharmacies', id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete pharmacy')
    }
  }
)

const pharmaciesSlice = createSlice({
  name: 'pharmacies',
  initialState,
  reducers: {
    setSelectedPharmacy: (state, action: PayloadAction<Pharmacy | null>) => {
      state.selectedPharmacy = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch pharmacies
      .addCase(fetchPharmacies.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPharmacies.fulfilled, (state, action) => {
        state.loading = false
        state.pharmacies = action.payload.data
        state.pagination = {
          currentPage: action.payload.meta.pagination.currentPage,
          totalPages: action.payload.meta.pagination.totalPages,
          totalItems: action.payload.meta.pagination.total,
          itemsPerPage: action.payload.meta.pagination.limit,
          hasNextPage: action.payload.meta.pagination.hasNextPage,
          hasPrevPage: action.payload.meta.pagination.hasPrevPage,
        }
      })
      .addCase(fetchPharmacies.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch pharmacies'
      })
      // Create pharmacy
      .addCase(createPharmacy.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createPharmacy.fulfilled, (state, action) => {
        state.loading = false
        state.pharmacies.push(action.payload)
      })
      .addCase(createPharmacy.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || action.error.message || 'Failed to create pharmacy'
      })
      // Update pharmacy
      .addCase(updatePharmacy.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePharmacy.fulfilled, (state, action) => {
        state.loading = false
        const index = state.pharmacies.findIndex(p => p.id === action.payload.id)
        if (index !== -1) {
          state.pharmacies[index] = action.payload
        }
        if (state.selectedPharmacy?.id === action.payload.id) {
          state.selectedPharmacy = action.payload
        }
      })
      .addCase(updatePharmacy.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || action.error.message || 'Failed to update pharmacy'
      })
      // Delete pharmacy
      .addCase(deletePharmacy.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deletePharmacy.fulfilled, (state, action) => {
        state.loading = false
        state.pharmacies = state.pharmacies.filter(p => p.id !== action.payload)
        if (state.selectedPharmacy?.id === action.payload) {
          state.selectedPharmacy = null
        }
        // Update pagination total
        state.pagination.totalItems = Math.max(0, state.pagination.totalItems - 1)
      })
      .addCase(deletePharmacy.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || action.error.message || 'Failed to delete pharmacy'
      })
  },
})

export const { setSelectedPharmacy, clearError } = pharmaciesSlice.actions
export default pharmaciesSlice.reducer