// Database schema types matching the backend models

export interface Pharmacy {
  id: number
  city_id: number
  name_me: string
  name_en?: string
  address: string
  lat: number
  lng: number
  is_24h: boolean
  open_sunday: boolean
  hours_monfri: string
  hours_sat: string
  hours_sun: string
  phone?: string
  website?: string
  active: boolean
  createdAt: string
  updatedAt: string
  city?: {
    id: number
    name_me: string
    name_en: string
    slug: string
  }
}

export interface Medicine {
  id: number
  name_me: string
  name_en?: string
  description?: string
  active: boolean
  createdAt: string
  updatedAt: string
  pharmacyMedicines?: Array<{
    pharmacy_id: number
    medicine_id: number
    pharmacy?: Pharmacy
  }>
}

export interface Ad {
  id: number
  name_me: string
  name_en?: string
  image_url: string
  target_url: string
  active: boolean
  weight: number
  start_date?: string
  end_date?: string
  click_count: number
  impression_count: number
  createdAt: string
  updatedAt: string
}

export interface PharmacySubmission {
  id: number
  name_me: string
  name_en?: string
  address: string
  city_slug: string
  city_id?: number
  phone?: string
  website?: string
  active: boolean
  is_24h: boolean
  open_sunday: boolean
  hours_monfri: string
  hours_sat: string
  hours_sun: string
  lat: number
  lng: number
  email: string
  notes?: string
  status: 'received' | 'reviewed' | 'approved' | 'rejected'
  review_notes?: string
  createdAt: string
  updatedAt: string
}

export interface City {
  id: number
  slug: string
  name_me: string
  name_en: string
  latitude?: number
  longitude?: number
  createdAt: string
  updatedAt: string
}

export interface UserLocation {
  latitude: number
  longitude: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: any
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  meta: {
    timestamp: string
    pagination: {
      total: number
      totalPages: number
      currentPage: number
      limit: number
      hasNextPage: boolean
      hasPrevPage: boolean
      nextPage: number | null
      prevPage: number | null
    }
  }
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationState {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// Online Data Sync Types
export interface SyncResult {
  citySlug: string
  cityName: string
  success: boolean
  processed: number
  created: number
  updated: number
  pharmacies: Array<{
    id: number
    name: string
    action: 'created' | 'updated'
    google_place_id?: string
  }>
  message: string
  searchSummary?: {
    strategiesUsed: number
    uniquePlacesFound: number
    pharmacyRelatedPlaces: number
    apiCallsSuccessful: boolean
    processingTimeSeconds: number
  }
}

export interface SyncStatus {
  citySlug: string
  cityName: string
  pharmacyCount: number
  lastSync: string | null
}