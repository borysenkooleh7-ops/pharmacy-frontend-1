import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Ad, PaginationParams, PaginationState } from './types'
import { apiService, API_CONFIG } from '../../config/api'

interface AdsState {
  ads: Ad[]
  loading: boolean
  error: string | null
  selectedAd: Ad | null
  pagination: PaginationState
}

const initialState: AdsState = {
  ads: [],
  loading: false,
  error: null,
  selectedAd: null,
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
export const fetchAds = createAsyncThunk(
  'adminAds/fetchAds',
  async (params: PaginationParams = API_CONFIG.DEFAULT_PAGINATION) => {
    return await apiService.fetchPaginated<Ad>('/ads/all', params)
  }
)

export const createAd = createAsyncThunk(
  'adminAds/createAd',
  async (adData: Omit<Ad, 'id' | 'createdAt' | 'updatedAt' | 'click_count' | 'impression_count'>, { rejectWithValue }) => {
    try {
      const data = await apiService.create<Ad>('/ads', adData)
      return data.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create ad')
    }
  }
)

export const updateAd = createAsyncThunk(
  'adminAds/updateAd',
  async ({ id, ...adData }: Partial<Ad> & { id: number }, { rejectWithValue }) => {
    try {
      const data = await apiService.update<Ad>('/ads', id, adData)
      return data.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update ad')
    }
  }
)

export const deleteAd = createAsyncThunk(
  'adminAds/deleteAd',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiService.delete('/ads', id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete ad')
    }
  }
)

const adsSlice = createSlice({
  name: 'adminAds',
  initialState,
  reducers: {
    setSelectedAd: (state, action: PayloadAction<Ad | null>) => {
      state.selectedAd = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch ads
      .addCase(fetchAds.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAds.fulfilled, (state, action) => {
        state.loading = false
        state.ads = action.payload.data
        state.pagination = {
          currentPage: action.payload.meta.pagination.currentPage,
          totalPages: action.payload.meta.pagination.totalPages,
          totalItems: action.payload.meta.pagination.total,
          itemsPerPage: action.payload.meta.pagination.limit,
          hasNextPage: action.payload.meta.pagination.hasNextPage,
          hasPrevPage: action.payload.meta.pagination.hasPrevPage,
        }
      })
      .addCase(fetchAds.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch ads'
      })
      // Create ad
      .addCase(createAd.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createAd.fulfilled, (state, action) => {
        state.loading = false
        state.ads.unshift(action.payload) // Add to beginning since backend sorts by most recent first
        // Update pagination total
        state.pagination.totalItems = state.pagination.totalItems + 1
      })
      .addCase(createAd.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || action.error.message || 'Failed to create ad'
      })
      // Update ad
      .addCase(updateAd.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateAd.fulfilled, (state, action) => {
        state.loading = false
        const index = state.ads.findIndex(a => a.id === action.payload.id)
        if (index !== -1) {
          state.ads[index] = action.payload
        }
        if (state.selectedAd?.id === action.payload.id) {
          state.selectedAd = action.payload
        }
      })
      .addCase(updateAd.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || action.error.message || 'Failed to update ad'
      })
      // Delete ad
      .addCase(deleteAd.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteAd.fulfilled, (state, action) => {
        state.loading = false
        state.ads = state.ads.filter(a => a.id !== action.payload)
        if (state.selectedAd?.id === action.payload) {
          state.selectedAd = null
        }
        // Update pagination total
        state.pagination.totalItems = Math.max(0, state.pagination.totalItems - 1)
      })
      .addCase(deleteAd.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || action.error.message || 'Failed to delete ad'
      })
  },
})

export const { setSelectedAd, clearError } = adsSlice.actions
export default adsSlice.reducer