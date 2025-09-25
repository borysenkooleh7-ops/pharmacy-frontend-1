import { useState, useEffect, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { clearFilters, initializeUserLocationAndPharmacies, searchMedicines, clearMedicines, setSearchType, setSelectedCity, updateFilters } from '../store/pharmacySlice'
import { useTranslation } from '../translations'
import LoadingSpinner from './ui/LoadingSpinner'
import { PharmacyIcon, MedicineIcon } from './ui/Icons'
import { usePharmacyFilters } from '../hooks/usePharmacyFilters'
import { useDebounce } from '../hooks/useDebounce'
import type { Medicine } from '../store/slices/types'

export default function SearchAndFilterSection(): React.JSX.Element {
  const dispatch = useAppDispatch()
  const { language, isLoadingLocation } = useAppSelector(state => state.ui)
  const {
    searchType,
    filters,
    medicines,
    loading,
    error
  } = useAppSelector(state => state.pharmacy)

  const isNearbyLoading = isLoadingLocation || loading.pharmacies
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('')
  const t = useTranslation(language)

  // Local state for immediate input feedback
  const [localSearchTerm, setLocalSearchTerm] = useState(filters.search || '')

  // Debounce the local search term for API calls
  const debouncedSearch = useDebounce(localSearchTerm, 300)

  // Update filters when debounced search changes (prevent infinite loop)
  useEffect(() => {
    if (searchType === 'pharmacy') {
      // Only dispatch if the values are actually different
      if (debouncedSearch !== filters.search) {
        dispatch(updateFilters({ search: debouncedSearch }))
      }
    }
  }, [debouncedSearch, searchType]) // Removed dispatch dependency to prevent loops

  // REMOVED: The problematic sync useEffect that was causing render loops

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setLocalSearchTerm(event.target.value)
  }

  const handleMedicineSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value
    setMedicineSearchTerm(value)

    if (value.length > 2) {
      dispatch(searchMedicines(value))
    } else {
      dispatch(clearMedicines())
    }
  }

  const handleSearchTypeChange = (type: 'pharmacy' | 'medicine'): void => {
    dispatch(setSearchType(type))
    if (type === 'pharmacy') {
      setMedicineSearchTerm('')
      setLocalSearchTerm(filters.search || '')
    } else {
      setLocalSearchTerm('')
    }
  }

  const handleFilterToggle = (filterKey: string): void => {
    if (filterKey === 'nearby') {
      handleNearbyFilter()
    } else {
      dispatch(updateFilters({ [filterKey]: !filters[filterKey] }))
    }
  }

  const handleNearbyFilter = () => {
    if (filters.nearby) {
      // Turn off nearby filter
      dispatch(updateFilters({ nearby: false }))
      return
    }

    // Clear selected city when using nearby search and trigger the same logic as initial rendering
    dispatch(setSelectedCity(null))
    dispatch(initializeUserLocationAndPharmacies(language))
  }

  const handleClearFilters = () => {
    dispatch(clearFilters())
    setLocalSearchTerm('')
  }

  return (
    <div className="bg-card shadow-md border border-primary-light rounded-lg p-2 mb-2">
      <div className="max-w-full mx-auto">
        {/* Single Line Layout */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Type Tabs - Compact */}
          <div className="flex bg-background-secondary rounded-md p-0.5 border border-border-light">
            <button
              onClick={() => handleSearchTypeChange('pharmacy')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                searchType === 'pharmacy'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-white hover:bg-primary'
              }`}
            >
              {t('searchPlaceholder').split(' ')[0]}
            </button>
            <button
              onClick={() => handleSearchTypeChange('medicine')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                searchType === 'medicine'
                  ? 'bg-success text-white shadow-sm'
                  : 'text-text-secondary hover:text-white hover:bg-success'
              }`}
            >
              {t('medicineSearch')}
            </button>
          </div>

          {/* Search Input - Compact */}
          <div className="relative flex-1 min-w-64">
            <input
              type="text"
              value={searchType === 'pharmacy' ? localSearchTerm : medicineSearchTerm}
              onChange={searchType === 'pharmacy' ? handleSearchChange : handleMedicineSearchChange}
              placeholder={searchType === 'pharmacy' ? t('searchPlaceholder') : t('medicineSearch')}
              className="w-full px-3 py-2 pl-8 text-sm bg-white border border-border-light rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200 text-text-primary placeholder:text-text-tertiary shadow-sm hover:border-primary"
            />
            <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
              {searchType === 'pharmacy' ? (
                <PharmacyIcon className="w-3.5 h-3.5 text-primary" />
              ) : (
                <MedicineIcon className="w-3.5 h-3.5 text-success" />
              )}
            </div>
            {loading.medicines && searchType === 'medicine' && (
              <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>

          {/* Filters - Compact */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleFilterToggle('is24h')}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 ${
                filters.is24h
                  ? 'bg-success text-white border-success hover:bg-success-hover shadow-sm'
                  : 'bg-white text-text-primary border-border-light hover:bg-success hover:text-white hover:border-success'
              }`}
            >
              {t('filter24h')}
            </button>

            <button
              onClick={() => handleFilterToggle('openSunday')}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 ${
                filters.openSunday
                  ? 'bg-warning text-white border-warning hover:bg-warning-hover shadow-sm'
                  : 'bg-white text-text-primary border-border-light hover:bg-warning hover:text-white hover:border-warning'
              }`}
            >
              {t('filterSunday')}
            </button>

            <button
              onClick={() => handleFilterToggle('nearby')}
              disabled={isNearbyLoading}
              className={`px-4 py-2 rounded-md border text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-md ${
                filters.nearby
                  ? 'bg-primary text-white border-primary hover:bg-primary-hover shadow-lg transform scale-105'
                  : 'bg-gradient-to-r from-primary to-primary-dark text-white border-primary hover:from-primary-hover hover:to-primary-dark hover:shadow-lg transform hover:scale-105'
              } ${isNearbyLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isNearbyLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              )}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              📍 {t('filterNearby')}
            </button>

              <button
                onClick={handleClearFilters}
                className="px-3 py-1.5 rounded-md border border-danger text-danger hover:bg-danger hover:text-white transition-all duration-200 text-xs font-medium shadow-sm"
              >
                {t('clearFilters')}
              </button>
          </div>
        </div>

        {/* Error Display - Compact */}
        {error.medicines && searchType === 'medicine' && (
          <div className="mt-3 p-2 bg-danger-light border border-danger rounded-md">
            <p className="text-danger text-xs font-medium">
              {t('medicineSearchFailed')}
            </p>
          </div>
        )}

        {/* Medicine Search Results - Compact */}
        {searchType === 'medicine' && medicines.length > 0 && (
          <div className="mt-3 max-h-32 overflow-y-auto bg-background-secondary rounded-md border border-primary-light shadow-sm">
            {medicines.map((medicine: Medicine) => (
              <div
                key={medicine.id}
                className="p-2 hover:bg-card cursor-pointer border-b border-border-light last:border-b-0 transition-all duration-200 hover:bg-primary-lighter"
              >
                <h4 className="text-sm font-medium text-text-primary">
                  {language === 'me' ? medicine.name_me : (medicine.name_en || medicine.name_me)}
                </h4>
                {medicine.pharmacyMedicines && medicine.pharmacyMedicines.length > 0 && (
                  <p className="text-xs text-success mt-1 font-medium">
                    {t('availableAt')} {medicine.pharmacyMedicines.length} {t('pharmacies')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No Results Message - Compact */}
        {searchType === 'medicine' && medicineSearchTerm.length > 2 && medicines.length === 0 && !loading.medicines && !error.medicines && (
          <div className="mt-3 p-2 bg-background-secondary border border-border-light rounded-md text-center">
            <p className="text-text-secondary text-xs">{t('noMedicinesFound')} "{medicineSearchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  )
}