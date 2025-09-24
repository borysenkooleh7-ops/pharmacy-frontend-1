import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiService } from '../config/api'
import type {
  Pharmacy,
  City,
  Medicine
} from './slices/types'

type SearchType = 'pharmacy' | 'medicine'

interface PharmacySubmissionData {
  name_me: string
  name_en?: string
  address: string
  city_slug: string
  email: string
  phone?: string
  website?: string
  lat: number
  lng: number
  hours_monfri: string
  hours_sat: string
  hours_sun: string
  is_24h: boolean
  open_sunday: boolean
  notes?: string
}

interface PharmacyFilters {
  is24h: boolean
  openSunday: boolean
  search: string
  medicineSearch: string
  nearby: boolean
  sortBy?: string
}

interface PharmacyState {
  pharmacies: Pharmacy[]
  cities: City[]
  medicines: Medicine[]
  selectedPharmacy: Pharmacy | null
  selectedCity: City | null
  searchType: SearchType
  filters: PharmacyFilters
  loading: {
    pharmacies: boolean
    cities: boolean
    medicines: boolean
    submission: boolean
  }
  error: {
    pharmacies: string | null
    cities: string | null
    medicines: string | null
    submission: string | null
  }
  submissionSuccess: boolean
}

export const fetchPharmacies = createAsyncThunk<
  Pharmacy[],
  { params?: Record<string, any>; language?: string },
  { rejectValue: string }
>(
  'pharmacy/fetchPharmacies',
  async ({ params = {}, language }, { rejectWithValue }) => {
    try {
      return await apiService.getPharmacies(params, language)
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchCities = createAsyncThunk<
  City[],
  string | undefined,
  { rejectValue: string }
>(
  'pharmacy/fetchCities',
  async (language, { rejectWithValue }) => {
    try {
      return await apiService.getCities(language)
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchMedicines = createAsyncThunk<
  Medicine[],
  string,
  { rejectValue: string }
>(
  'pharmacy/fetchMedicines',
  async (searchTerm, { rejectWithValue }) => {
    try {
      return await apiService.getMedicines({ search: searchTerm })
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const searchMedicines = createAsyncThunk<
  Medicine[],
  string,
  { rejectValue: string }
>(
  'pharmacy/searchMedicines',
  async (searchTerm, { rejectWithValue }) => {
    try {
      return await apiService.searchMedicines(searchTerm)
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchNearbyPharmacies = createAsyncThunk<
  Pharmacy[],
  { lat: number; lng: number; radius?: number; limit?: number; language?: string },
  { rejectValue: string }
>(
  'pharmacy/fetchNearbyPharmacies',
  async ({ lat, lng, radius, limit, language }, { rejectWithValue }) => {
    try {
      const defaultRadius = parseInt(import.meta.env.VITE_SEARCH_RADIUS) || 2000
      const defaultLimit = parseInt(import.meta.env.VITE_N_PHARMACIES) || 20
      return await apiService.getNearbyPharmacies(lat, lng, radius || defaultRadius, limit || defaultLimit, language)
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchPharmacyById = createAsyncThunk<
  Pharmacy,
  number,
  { rejectValue: string }
>(
  'pharmacy/fetchPharmacyById',
  async (id, { rejectWithValue }) => {
    try {
      return await apiService.getPharmacyById(id)
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const submitPharmacy = createAsyncThunk<
  any,
  PharmacySubmissionData,
  { rejectValue: string }
>(
  'pharmacy/submitPharmacy',
  async (submissionData, { rejectWithValue }) => {
    try {
      return await apiService.createSubmission(submissionData)
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const initializeUserLocationAndPharmacies = createAsyncThunk<
  { location: { latitude: number; longitude: number }; pharmacies: Pharmacy[] },
  string | undefined,
  { rejectValue: string }
>(
  'pharmacy/initializeUserLocationAndPharmacies',
  async (language, { rejectWithValue }) => {
    try {
      // Try IP-based location first
      let location = null

      try {
        const ipResponse = await fetch('https://ipapi.co/json/')
        const ipData = await ipResponse.json()

        if (ipData.latitude && ipData.longitude) {
          location = {
            latitude: ipData.latitude,
            longitude: ipData.longitude
          }
        }
      } catch (error) {
        console.warn('IP location failed, trying GPS:', error)
      }

      // Fallback to GPS if IP location failed
      if (!location) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 600000 // 10 minutes cache
              }
            )
          })

          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        } catch (error) {
          throw new Error('Could not determine user location')
        }
      }

      // Fetch nearby pharmacies
      const defaultRadius = parseInt(import.meta.env.VITE_SEARCH_RADIUS) || 2000
      const defaultLimit = parseInt(import.meta.env.VITE_N_PHARMACIES) || 20

      const pharmacies = await apiService.getNearbyPharmacies(
        location.latitude,
        location.longitude,
        defaultRadius,
        defaultLimit,
        language
      )

      return { location, pharmacies }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const initialState: PharmacyState = {
  pharmacies: [],
  cities: [],
  medicines: [],
  selectedPharmacy: null,
  selectedCity: null,
  searchType: 'pharmacy',
  filters: {
    is24h: false,
    openSunday: false,
    search: '',
    medicineSearch: '',
    nearby: false
  },
  loading: {
    pharmacies: false,
    cities: false,
    medicines: false,
    submission: false,
  },
  error: {
    pharmacies: null,
    cities: null,
    medicines: null,
    submission: null,
  },
  submissionSuccess: false,
}

const pharmacySlice = createSlice({
  name: 'pharmacy',
  initialState,
  reducers: {
    setSelectedCity: (state, action: PayloadAction<City | null>) => {
      state.selectedCity = action.payload
      state.pharmacies = []
      // Clear nearby filter when selecting a city to allow city pharmacy fetching
      state.filters.nearby = false
    },
    setSelectedPharmacy: (state, action: PayloadAction<Pharmacy | null>) => {
      state.selectedPharmacy = action.payload
    },
    setSearchType: (state, action: PayloadAction<SearchType>) => {
      state.searchType = action.payload
      if (action.payload === 'pharmacy') {
        state.medicines = []
        state.filters.medicineSearch = ''
      }
    },
    updateFilters: (state, action: PayloadAction<Partial<PharmacyFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setFilters: (state, action: PayloadAction<Partial<PharmacyFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload
    },
    clearFilters: (state) => {
      state.filters = {
        is24h: false,
        openSunday: false,
        search: '',
        medicineSearch: '',
        nearby: false
      }
    },
    clearMedicines: (state) => {
      state.medicines = []
    },
    setPharmacies: (state, action: PayloadAction<Pharmacy[]>) => {
      state.pharmacies = action.payload
      state.loading.pharmacies = false
      state.error.pharmacies = null
      state.filters.nearby = action.payload.length > 0
    },
    clearError: (state, action: PayloadAction<keyof PharmacyState['error']>) => {
      const errorType = action.payload
      if (errorType && state.error[errorType] !== undefined) {
        state.error[errorType] = null
      }
    },
    clearSubmissionSuccess: (state) => {
      state.submissionSuccess = false
    },
  },
  extraReducers: (builder) => {
    builder
      // Pharmacies
      .addCase(fetchPharmacies.pending, (state) => {
        state.loading.pharmacies = true
        state.error.pharmacies = null
      })
      .addCase(fetchPharmacies.fulfilled, (state, action) => {
        state.loading.pharmacies = false
        state.pharmacies = action.payload
        state.error.pharmacies = null
      })
      .addCase(fetchPharmacies.rejected, (state, action) => {
        state.loading.pharmacies = false
        state.error.pharmacies = action.payload || 'Failed to fetch pharmacies'
      })

      // Cities
      .addCase(fetchCities.pending, (state) => {
        state.loading.cities = true
        state.error.cities = null
      })
      .addCase(fetchCities.fulfilled, (state, action) => {
        state.loading.cities = false
        state.cities = action.payload
        state.error.cities = null
        if (!state.selectedCity && action.payload.length > 0) {
          state.selectedCity = action.payload.find(city => city.slug === 'podgorica') || action.payload[0]
        }
      })
      .addCase(fetchCities.rejected, (state, action) => {
        state.loading.cities = false
        state.error.cities = action.payload || 'Failed to fetch cities'
      })

      // Medicines
      .addCase(fetchMedicines.pending, (state) => {
        state.loading.medicines = true
        state.error.medicines = null
      })
      .addCase(fetchMedicines.fulfilled, (state, action) => {
        state.loading.medicines = false
        state.medicines = action.payload
        state.error.medicines = null
      })
      .addCase(fetchMedicines.rejected, (state, action) => {
        state.loading.medicines = false
        state.error.medicines = action.payload || 'Failed to fetch medicines'
      })

      // Search Medicines
      .addCase(searchMedicines.pending, (state) => {
        state.loading.medicines = true
        state.error.medicines = null
      })
      .addCase(searchMedicines.fulfilled, (state, action) => {
        state.loading.medicines = false
        state.medicines = action.payload
        state.error.medicines = null
      })
      .addCase(searchMedicines.rejected, (state, action) => {
        state.loading.medicines = false
        state.error.medicines = action.payload || 'Failed to search medicines'
      })

      // Nearby Pharmacies
      .addCase(fetchNearbyPharmacies.pending, (state) => {
        state.loading.pharmacies = true
        state.error.pharmacies = null
      })
      .addCase(fetchNearbyPharmacies.fulfilled, (state, action) => {
        state.loading.pharmacies = false
        state.pharmacies = action.payload
        state.filters.nearby = true
        state.error.pharmacies = null
      })
      .addCase(fetchNearbyPharmacies.rejected, (state, action) => {
        state.loading.pharmacies = false
        state.error.pharmacies = action.payload || 'Failed to fetch nearby pharmacies'
      })

      // Pharmacy Submission
      .addCase(submitPharmacy.pending, (state) => {
        state.loading.submission = true
        state.error.submission = null
        state.submissionSuccess = false
      })
      .addCase(submitPharmacy.fulfilled, (state) => {
        state.loading.submission = false
        state.error.submission = null
        state.submissionSuccess = true
      })
      .addCase(submitPharmacy.rejected, (state, action) => {
        state.loading.submission = false
        state.error.submission = action.payload || 'Failed to submit pharmacy'
        state.submissionSuccess = false
      })

      // Initialize User Location and Pharmacies
      .addCase(initializeUserLocationAndPharmacies.pending, (state) => {
        state.loading.pharmacies = true
        state.error.pharmacies = null
      })
      .addCase(initializeUserLocationAndPharmacies.fulfilled, (state, action) => {
        state.loading.pharmacies = false
        state.pharmacies = action.payload.pharmacies
        state.filters.nearby = true
        state.error.pharmacies = null
      })
      .addCase(initializeUserLocationAndPharmacies.rejected, (state, action) => {
        state.loading.pharmacies = false
        state.error.pharmacies = action.payload || 'Failed to initialize location and pharmacies'
      })
  },
})

export const {
  setSelectedCity,
  setSelectedPharmacy,
  setSearchType,
  updateFilters,
  setFilters,
  setSearchTerm,
  clearFilters,
  clearMedicines,
  setPharmacies,
  clearError,
  clearSubmissionSuccess
} = pharmacySlice.actions

export default pharmacySlice.reducer