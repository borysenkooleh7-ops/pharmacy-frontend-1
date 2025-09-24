import type {
  Pharmacy,
  City,
  Medicine,
  Ad,
  PharmacySubmission,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  SyncResult,
  SyncStatus
} from '../store/slices/types'

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  ADMIN_KEY: import.meta.env.VITE_ADMIN_KEY || 'admin123',
  DEFAULT_PAGINATION: {
    page: 1,
    limit: 20
  },
  HEADERS: {
    'Content-Type': 'application/json'
  }
}

interface RequestOptions extends RequestInit {
  headers?: HeadersInit
  includeAuth?: boolean
  language?: string
}

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

class ApiService {
  private createUrl(endpoint: string): string {
    return `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  }

  private createHeaders(includeAuth: boolean = true, language?: string): Record<string, string> {
    const headers = { ...API_CONFIG.HEADERS }
    if (includeAuth) {
      headers['x-admin-key'] = API_CONFIG.ADMIN_KEY
    }
    if (language) {
      headers['x-language'] = language
    }
    return headers
  }

  private createPaginationParams(params: PaginationParams = API_CONFIG.DEFAULT_PAGINATION): URLSearchParams {
    return new URLSearchParams({
      page: (params.page || API_CONFIG.DEFAULT_PAGINATION.page).toString(),
      limit: (params.limit || API_CONFIG.DEFAULT_PAGINATION.limit).toString(),
    })
  }

  private createQueryParams(params: Record<string, any> = {}): URLSearchParams {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value.toString())
      }
    })
    return queryParams
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { includeAuth = true, language, ...requestOptions } = options
    const url = this.createUrl(endpoint)
    const headers = this.createHeaders(includeAuth, language)

    const config: RequestInit = {
      ...requestOptions,
      headers: {
        ...headers,
        ...requestOptions.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Admin CRUD operations for Redux slices
  async fetchPaginated<T>(endpoint: string, params: PaginationParams = API_CONFIG.DEFAULT_PAGINATION): Promise<PaginatedResponse<T>> {
    const searchParams = this.createPaginationParams(params)
    return this.request<PaginatedResponse<T>>(`${endpoint}?${searchParams}`)
  }

  async create<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await this.request<ApiResponse<T>>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response
  }

  async update<T>(endpoint: string, id: number, data: any): Promise<ApiResponse<T>> {
    const response = await this.request<ApiResponse<T>>(`${endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response
  }

  async delete(endpoint: string, id: number): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`${endpoint}/${id}`, {
      method: 'DELETE',
    })
  }

  // Public API methods (no auth required)
  async getCities(language?: string): Promise<City[]> {
    const response = await this.request<ApiResponse<City[]>>('/cities', { includeAuth: false, language })
    return response.data || []
  }

  async getCityById(id: number): Promise<City> {
    const response = await this.request<ApiResponse<City>>(`/cities/${id}`, { includeAuth: false })
    return response.data
  }

  async getCityBySlug(slug: string): Promise<City> {
    const response = await this.request<ApiResponse<City>>(`/cities/slug/${slug}`, { includeAuth: false })
    return response.data
  }

  async getPharmacies(params: Record<string, any> = {}, language?: string): Promise<Pharmacy[]> {
    const queryParams = this.createQueryParams(params)
    const response = await this.request<ApiResponse<Pharmacy[]>>(`/pharmacies?${queryParams}`, { includeAuth: false, language })
    return response.data || []
  }

  async getPharmacyById(id: number): Promise<Pharmacy> {
    const response = await this.request<ApiResponse<Pharmacy>>(`/pharmacies/${id}`, { includeAuth: false })
    return response.data
  }

  async getNearbyPharmacies(lat: number, lng: number, radius: number = 10, limit: number = 20, language?: string): Promise<Pharmacy[]> {
    const response = await this.request<ApiResponse<Pharmacy[]>>(`/pharmacies/nearby/${lat}/${lng}?radius=${radius}&limit=${limit}`, { includeAuth: false, language })
    return response.data || []
  }

  async getMedicines(params: Record<string, any> = {}): Promise<Medicine[]> {
    const queryParams = this.createQueryParams(params)
    const response = await this.request<ApiResponse<Medicine[]>>(`/medicines?${queryParams}`, { includeAuth: false })
    return response.data || []
  }

  async getMedicineById(id: number): Promise<Medicine> {
    const response = await this.request<ApiResponse<Medicine>>(`/medicines/${id}`, { includeAuth: false })
    return response.data
  }

  async searchMedicines(searchTerm: string): Promise<Medicine[]> {
    const response = await this.request<ApiResponse<Medicine[]>>(`/medicines/search?q=${encodeURIComponent(searchTerm)}`, { includeAuth: false })
    return response.data || []
  }

  async getActiveAds(): Promise<Ad[]> {
    const response = await this.request<ApiResponse<Ad[]>>('/ads', { includeAuth: false })
    return response.data || []
  }

  async createSubmission(submissionData: PharmacySubmissionData): Promise<any> {
    const response = await this.request<ApiResponse<any>>('/pharmacy-submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
      includeAuth: false
    })
    return response.data
  }

  // Admin specific methods
  async updateSubmissionStatus(
    id: number,
    status: 'approved' | 'rejected' | 'reviewed',
    review_notes?: string,
    pharmacy_data?: any
  ): Promise<PharmacySubmission> {
    const response = await this.request<ApiResponse<PharmacySubmission>>(`/pharmacy-submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, review_notes, pharmacy_data }),
    })
    return response.data
  }

  // Online data sync methods
  async getSyncableCities(): Promise<City[]> {
    const response = await this.request<ApiResponse<City[]>>('/online-data/cities', {
      includeAuth: true
    })
    return response.data
  }

  async syncCityData(citySlug: string): Promise<SyncResult> {
    const response = await this.request<ApiResponse<SyncResult>>('/online-data/sync-city', {
      method: 'POST',
      body: JSON.stringify({ citySlug }),
      includeAuth: true
    })
    return response.data
  }

  async getSyncStatus(): Promise<SyncStatus[]> {
    const response = await this.request<ApiResponse<SyncStatus[]>>('/online-data/status', {
      includeAuth: true
    })
    return response.data
  }
}

export const apiService = new ApiService()
export default apiService

// Legacy exports for backward compatibility
export const createApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

export const createAuthHeaders = (includeAuth: boolean = true): Record<string, string> => {
  const headers = { ...API_CONFIG.HEADERS }
  if (includeAuth) {
    headers['x-admin-key'] = API_CONFIG.ADMIN_KEY
  }
  return headers
}

export const createPaginationParams = (params: PaginationParams = API_CONFIG.DEFAULT_PAGINATION): URLSearchParams => {
  return new URLSearchParams({
    page: (params.page || API_CONFIG.DEFAULT_PAGINATION.page).toString(),
    limit: (params.limit || API_CONFIG.DEFAULT_PAGINATION.limit).toString(),
  })
}

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  includeAuth: boolean = true
): Promise<T> => {
  return apiService.request<T>(endpoint, { ...options, includeAuth })
}