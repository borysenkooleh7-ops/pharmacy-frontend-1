// Pharmacy types
export interface Pharmacy {
  id: number
  city_id?: number
  name_me: string
  name_en?: string
  address: string
  city_slug: string
  phone?: string
  website?: string
  email?: string
  latitude?: number
  longitude?: number
  lat?: number  // Alternative coordinate format for Google Maps
  lng?: number  // Alternative coordinate format for Google Maps
  is_24h: boolean
  open_sunday: boolean
  hours_monfri?: string
  hours_saturday?: string
  hours_sunday?: string
  notes?: string
  created_at: string
  updated_at: string
}

// City types
export interface City {
  id: number
  name_me: string
  name_en?: string
  slug: string
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
}

// Medicine types
export interface Medicine {
  id: number
  name: string
  name_me?: string
  name_en?: string
  description?: string
  manufacturer?: string
  dosage?: string
  form?: string
  pharmacyMedicines?: Array<{
    pharmacy_id: number
    medicine_id: number
    availability: boolean
    price?: number
  }>
  created_at: string
  updated_at: string
}

// Ad types
export interface Ad {
  id: number
  name: string
  image_url: string
  target_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Form data types
export interface PharmacySubmissionData {
  name_me: string
  name_en?: string
  address: string
  city_slug: string
  phone?: string
  website?: string
  email: string
  lat: string | number
  lng: string | number
  is_24h: boolean
  open_sunday: boolean
  hours_monfri: string
  hours_sat: string
  hours_sun: string
  notes?: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// Filter types
export interface PharmacyFilters {
  is24h?: boolean
  openSunday?: boolean
  search?: string
  medicineSearch?: string
  nearby?: boolean
  sortBy?: 'name' | 'distance' | 'rating'
}

// Loading states
export interface LoadingStates {
  pharmacies: boolean
  cities: boolean
  medicines: boolean
  submission: boolean
}

// Error states
export interface ErrorStates {
  pharmacies: string | null
  cities: string | null
  medicines: string | null
  submission: string | null
}

// Location types
export interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

// Search types
export type SearchType = 'pharmacy' | 'medicine'

// Component prop types
export interface LayoutProps {
  children: React.ReactNode
}

export interface ErrorMessageProps {
  error: string | null
  onRetry?: () => void
  className?: string
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}