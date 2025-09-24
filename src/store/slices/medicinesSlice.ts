import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Medicine, ApiResponse, PaginatedResponse, PaginationParams, PaginationState } from './types'
import { apiService, API_CONFIG } from '../../config/api'

interface MedicinesState {
  medicines: Medicine[]
  loading: boolean
  error: string | null
  selectedMedicine: Medicine | null
  pagination: PaginationState
}

const initialState: MedicinesState = {
  medicines: [],
  loading: false,
  error: null,
  selectedMedicine: null,
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
export const fetchMedicines = createAsyncThunk(
  'medicines/fetchMedicines',
  async (params: PaginationParams = API_CONFIG.DEFAULT_PAGINATION) => {
    return await apiService.fetchPaginated<Medicine>('/medicines', params)
  }
)

export const createMedicine = createAsyncThunk(
  'medicines/createMedicine',
  async (medicineData: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => {
    const data = await apiService.create<Medicine>('/medicines', medicineData)
    return data.data
  }
)

export const updateMedicine = createAsyncThunk(
  'medicines/updateMedicine',
  async ({ id, ...medicineData }: Partial<Medicine> & { id: number }) => {
    const data = await apiService.update<Medicine>('/medicines', id, medicineData)
    return data.data
  }
)

export const deleteMedicine = createAsyncThunk(
  'medicines/deleteMedicine',
  async (id: number) => {
    await apiService.delete('/medicines', id)
    return id
  }
)

const medicinesSlice = createSlice({
  name: 'medicines',
  initialState,
  reducers: {
    setSelectedMedicine: (state, action: PayloadAction<Medicine | null>) => {
      state.selectedMedicine = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch medicines
      .addCase(fetchMedicines.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMedicines.fulfilled, (state, action) => {
        state.loading = false
        state.medicines = action.payload.data
        state.pagination = {
          currentPage: action.payload.meta.pagination.currentPage,
          totalPages: action.payload.meta.pagination.totalPages,
          totalItems: action.payload.meta.pagination.total,
          itemsPerPage: action.payload.meta.pagination.limit,
          hasNextPage: action.payload.meta.pagination.hasNextPage,
          hasPrevPage: action.payload.meta.pagination.hasPrevPage,
        }
      })
      .addCase(fetchMedicines.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch medicines'
      })
      // Create medicine
      .addCase(createMedicine.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createMedicine.fulfilled, (state, action) => {
        state.loading = false
        state.medicines.push(action.payload)
      })
      .addCase(createMedicine.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create medicine'
      })
      // Update medicine
      .addCase(updateMedicine.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateMedicine.fulfilled, (state, action) => {
        state.loading = false
        const index = state.medicines.findIndex(m => m.id === action.payload.id)
        if (index !== -1) {
          state.medicines[index] = action.payload
        }
        if (state.selectedMedicine?.id === action.payload.id) {
          state.selectedMedicine = action.payload
        }
      })
      .addCase(updateMedicine.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to update medicine'
      })
      // Delete medicine
      .addCase(deleteMedicine.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteMedicine.fulfilled, (state, action) => {
        state.loading = false
        state.medicines = state.medicines.filter(m => m.id !== action.payload)
        if (state.selectedMedicine?.id === action.payload) {
          state.selectedMedicine = null
        }
        // Update pagination total
        state.pagination.totalItems = Math.max(0, state.pagination.totalItems - 1)
      })
      .addCase(deleteMedicine.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to delete medicine'
      })
  },
})

export const { setSelectedMedicine, clearError } = medicinesSlice.actions
export default medicinesSlice.reducer