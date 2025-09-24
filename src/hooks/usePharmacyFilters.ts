import { useState, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from './redux'
import { updateFilters, fetchPharmacies } from '../store/pharmacySlice'
import { useDebounce } from './useDebounce'

/**
 * Custom hook to manage pharmacy filtering logic
 * Separates filtering concerns from UI components to prevent render loops
 */
export const usePharmacyFilters = (language: string) => {
  const dispatch = useAppDispatch()
  const { filters, selectedCity, searchType } = useAppSelector(state => state.pharmacy)

  // Local state for immediate search input feedback
  const [localSearchTerm, setLocalSearchTerm] = useState(filters.search || '')

  // Debounce search term
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300)

  // Update Redux filters when debounced search changes
  useEffect(() => {
    if (searchType === 'pharmacy' && debouncedSearchTerm !== filters.search) {
      dispatch(updateFilters({ search: debouncedSearchTerm }))
    }
  }, [debouncedSearchTerm, searchType, dispatch])

  // Reset local search when filters are cleared externally
  useEffect(() => {
    if (filters.search === '' && localSearchTerm !== '') {
      setLocalSearchTerm('')
    }
  }, [filters.search, localSearchTerm])

  // Memoized filter parameters for API calls
  const filterParams = useMemo(() => ({
    search: filters.search || '',
    is24h: filters.is24h,
    openSunday: filters.openSunday
  }), [filters.search, filters.is24h, filters.openSunday])

  // Function to fetch pharmacies with current filters
  const fetchPharmaciesWithFilters = (cityId: number) => {
    dispatch(fetchPharmacies({
      params: {
        cityId,
        unlimited: true,
        ...filterParams
      },
      language
    }))
  }

  // Function to toggle filter states
  const toggleFilter = (filterKey: string) => {
    dispatch(updateFilters({ [filterKey]: !filters[filterKey] }))
  }

  // Function to handle search input changes
  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value)
  }

  return {
    localSearchTerm,
    filterParams,
    filters,
    handleSearchChange,
    toggleFilter,
    fetchPharmaciesWithFilters
  }
}