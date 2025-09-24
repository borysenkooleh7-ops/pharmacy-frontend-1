import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiService } from '../../config/api'
import { City, SyncResult } from './types'

interface CitySync {
  citySlug: string
  cityName: string
  status: 'pending' | 'syncing' | 'success' | 'error'
  result?: SyncResult
  error?: string
  retryCount: number
  maxRetries: number
}

interface OnlineDataState {
  cities: City[]
  citiesLoading: boolean
  syncInProgress: boolean
  currentSync: CitySync | null
  syncQueue: string[] // Array of city slugs to sync
  completedSyncs: CitySync[]
  failedSyncs: CitySync[]
  totalCities: number
  processedCities: number
  error: string | null
  overallProgress: number
}

const initialState: OnlineDataState = {
  cities: [],
  citiesLoading: false,
  syncInProgress: false,
  currentSync: null,
  syncQueue: [],
  completedSyncs: [],
  failedSyncs: [],
  totalCities: 0,
  processedCities: 0,
  error: null,
  overallProgress: 0
}

// Async thunks
export const fetchSyncableCities = createAsyncThunk(
  'onlineData/fetchSyncableCities',
  async (_, { rejectWithValue }) => {
    try {
      return await apiService.getSyncableCities()
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch cities')
    }
  }
)

export const syncCityData = createAsyncThunk(
  'onlineData/syncCityData',
  async (citySlug: string, { rejectWithValue }) => {
    try {
      return await apiService.syncCityData(citySlug)
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync city data')
    }
  }
)

const onlineDataSlice = createSlice({
  name: 'onlineData',
  initialState,
  reducers: {
    startBulkSync: (state, action: PayloadAction<string[]>) => {
      const citySlugs = action.payload
      state.syncInProgress = true
      state.syncQueue = [...citySlugs]
      state.completedSyncs = []
      state.failedSyncs = []
      state.totalCities = citySlugs.length
      state.processedCities = 0
      state.overallProgress = 0
      state.error = null

      // Initialize the first city to sync
      if (citySlugs.length > 0) {
        const firstCitySlug = state.syncQueue.shift()!
        const firstCity = state.cities.find(c => c.slug === firstCitySlug)
        state.currentSync = {
          citySlug: firstCitySlug,
          cityName: firstCity?.name_en || firstCitySlug,
          status: 'pending',
          retryCount: 0,
          maxRetries: 3
        }
      } else {
        state.currentSync = null
      }
    },

    stopBulkSync: (state) => {
      state.syncInProgress = false
      state.syncQueue = []
      state.currentSync = null
    },

    updateProgress: (state) => {
      if (state.totalCities > 0) {
        state.overallProgress = Math.round((state.processedCities / state.totalCities) * 100)
      }
    },

    moveToNextCity: (state) => {
      // Move current sync to completed or failed
      if (state.currentSync) {
        if (state.currentSync.status === 'success') {
          state.completedSyncs.push(state.currentSync)
        } else if (state.currentSync.status === 'error') {
          // Check if we should retry
          if (state.currentSync.retryCount < state.currentSync.maxRetries) {
            // Add back to queue for retry
            state.syncQueue.unshift(state.currentSync.citySlug)
          } else {
            // Max retries reached, move to failed
            state.failedSyncs.push(state.currentSync)
          }
        }

        state.processedCities++
      }

      // Get next city from queue
      if (state.syncQueue.length > 0) {
        const nextCitySlug = state.syncQueue.shift()!
        const nextCity = state.cities.find(c => c.slug === nextCitySlug)

        // Check if this is a retry
        const existingSync = state.failedSyncs.find(s => s.citySlug === nextCitySlug)
        const retryCount = existingSync ? existingSync.retryCount + 1 : 0

        state.currentSync = {
          citySlug: nextCitySlug,
          cityName: nextCity?.name_en || nextCitySlug,
          status: 'pending',
          retryCount,
          maxRetries: 3
        }
      } else {
        // No more cities to sync
        state.currentSync = null
        state.syncInProgress = false
      }

      // Update progress
      if (state.totalCities > 0) {
        state.overallProgress = Math.round((state.processedCities / state.totalCities) * 100)
      }
    },

    clearSyncResults: (state) => {
      state.completedSyncs = []
      state.failedSyncs = []
      state.processedCities = 0
      state.overallProgress = 0
      state.error = null
    },

    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch cities
      .addCase(fetchSyncableCities.pending, (state) => {
        state.citiesLoading = true
        state.error = null
      })
      .addCase(fetchSyncableCities.fulfilled, (state, action) => {
        state.citiesLoading = false
        state.cities = action.payload
      })
      .addCase(fetchSyncableCities.rejected, (state, action) => {
        state.citiesLoading = false
        state.error = action.payload as string || action.error.message || 'Failed to fetch cities'
      })

      // Sync city data
      .addCase(syncCityData.pending, (state) => {
        if (state.currentSync) {
          state.currentSync.status = 'syncing'
        }
      })
      .addCase(syncCityData.fulfilled, (state, action) => {
        if (state.currentSync) {
          state.currentSync.status = 'success'
          state.currentSync.result = action.payload
        }
      })
      .addCase(syncCityData.rejected, (state, action) => {
        if (state.currentSync) {
          state.currentSync.status = 'error'
          state.currentSync.error = action.payload as string || action.error.message || 'Failed to sync city'
        }
      })
  }
})

export const {
  startBulkSync,
  stopBulkSync,
  updateProgress,
  moveToNextCity,
  clearSyncResults,
  clearError
} = onlineDataSlice.actions

export default onlineDataSlice.reducer