import { useEffect, useState, useMemo, useRef } from 'react'
import { fetchPharmacies, initializeUserLocationAndPharmacies, clearFilters } from '../store/pharmacySlice'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { useTranslation } from '../translations'
import SearchAndFilterSection from '../components/SearchAndFilterSection'
import MapSection from '../components/MapSection'
import PharmacyList from '../components/PharmacyList'
import AdvertisingBanner from '../components/AdvertisingBanner'
import BenefitsSection from '../components/BenefitsSection'
import ErrorMessage from '../components/ui/ErrorMessage'
import { PageLoader } from '../components/ui/LoadingSpinner'


export default function HomePage(): React.JSX.Element {
  const dispatch = useAppDispatch()
  const [isPharmacyListOpen, setIsPharmacyListOpen] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const previousFilterParamsRef = useRef('')
  const { userLocation, isLoadingLocation, language } = useAppSelector(state => state.ui)
  const {
    selectedCity,
    filters,
    loading,
    error,
    pharmacies
  } = useAppSelector(state => state.pharmacy)
  const t = useTranslation(language)

  // Initial rendering: Get user location and find N nearest pharmacies
  useEffect(() => {
    if (!userLocation && !initialLoadComplete && !isLoadingLocation) {
      dispatch(initializeUserLocationAndPharmacies(language))
      setInitialLoadComplete(true)
    }
  }, [dispatch, userLocation, initialLoadComplete, isLoadingLocation, language])

  // Memoize filter params to prevent unnecessary re-renders
  const filterParams = useMemo(() => ({
    search: filters.search || '',
    is24h: filters.is24h,
    openSunday: filters.openSunday
  }), [filters.search, filters.is24h, filters.openSunday])

  // Handle pharmacy searches - global search when typing, city-based when no search term
  useEffect(() => {
    if (!initialLoadComplete) return

    if (!filters.nearby) {
      // Determine search scope: global search when user has typed something, city-based otherwise
      const hasSearchTerm = filterParams.search && filterParams.search.trim().length > 0
      const cityId = hasSearchTerm ? null : selectedCity?.id // Global search if there's a search term

      // Only proceed if we have either a search term (global) or a selected city (city-based)
      if (hasSearchTerm || selectedCity) {
        // Prevent unnecessary re-fetches by comparing serialized filter params
        const currentFilterParamsStr = JSON.stringify(filterParams)
        const currentKey = `${cityId || 'global'}-${currentFilterParamsStr}`

        if (previousFilterParamsRef.current !== currentKey) {
        console.log('🔍 Fetching pharmacies with filters:', {
          ...filterParams,
          scope: hasSearchTerm ? 'global' : 'city-based',
          cityId
        })

        dispatch(fetchPharmacies({
          params: {
            ...(cityId && { cityId }), // Only include cityId if not doing global search
            unlimited: true,
            ...filterParams
          },
          language
        }))
        setIsPharmacyListOpen(false)
        previousFilterParamsRef.current = currentKey
        }
      }
    }
  }, [selectedCity?.id, filterParams, filters.nearby, initialLoadComplete, language]) // Simplified dependencies

  const handleRetryPharmacies = (): void => {
    if (selectedCity) {
      dispatch(fetchPharmacies({
        params: {
          cityId: selectedCity.id,
          unlimited: true, // Fetch all pharmacies for map display
          ...filters
        },
        language
      }))
    }
  }

  // Show loader while cities are loading initially
  if (loading.cities && !selectedCity) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Error Message */}
      {error.pharmacies && (
        <ErrorMessage
          error={error.pharmacies}
          onRetry={handleRetryPharmacies}
          className="mb-4 mx-4 lg:mb-6 lg:mx-0"
        />
      )}

      {/* Montenegro User Guidance */}
      {initialLoadComplete && !userLocation && !selectedCity && (
        <div className="container mx-auto px-4 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  {t('welcome')} 🇲🇪
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    {t('welcomeDescription')}
                  </p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>{t('welcomeStep1')}</li>
                    <li>{t('welcomeStep2')}</li>
                    <li>{t('welcomeStep3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="container mx-auto px-4">
        <SearchAndFilterSection />
      </div>

      {/* Mobile Pharmacy List Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsPharmacyListOpen(true)}
          className="bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-hover transition-colors"
          aria-label="Open pharmacy list"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Left Slide Menu Overlay */}
      {isPharmacyListOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-white bg-opacity-30 backdrop-blur-sm z-40"
          onClick={() => setIsPharmacyListOpen(false)}
        />
      )}

      {/* Mobile Left Slide Menu */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-80 bg-background shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        isPharmacyListOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-text-primary">{t('pharmaciesList')}</h3>
            <button
              onClick={() => setIsPharmacyListOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
          <PharmacyList onPharmacySelect={() => setIsPharmacyListOpen(false)} />
      </div>

      {/* Main Layout */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Desktop Left Sidebar */}
          <div className="hidden lg:block w-[400px] flex-shrink-0">
            {/* Ad block at top */}
            <div className="mb-4">
              <AdvertisingBanner />
            </div>

            {/* Pharmacy list below ad */}
            <PharmacyList />
          </div>

          {/* Main Content Area */}
          <div className="w-full lg:flex-1">
            {/* Map Section */}
            <div className="mb-4">
              <MapSection />
            </div>

            {/* No Results Message */}
            {!loading.pharmacies && !error.pharmacies && selectedCity && pharmacies.length === 0 && (
              <div className="bg-card border border-primary-light rounded-lg p-4 lg:p-6 text-center mb-4">
                <div className="text-2xl lg:text-3xl mb-3">🔍</div>
                <h3 className="text-base lg:text-lg font-semibold text-text-primary mb-2">
                  {t('noPharmaciesFound')}
                </h3>
                <p className="text-sm lg:text-base text-text-secondary mb-4">
                  Try adjusting your search or filters.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => dispatch(clearFilters())}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover active:bg-primary-active transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg text-sm lg:text-base"
                  >
                    {t('clearFiltersAction')}
                  </button>
                  <button
                    onClick={handleRetryPharmacies}
                    className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary-lighter active:bg-primary-light transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-md text-sm lg:text-base"
                  >
                    {t('retryAction')}
                  </button>
                </div>
              </div>
            )}

            {/* Promotion Sections - Desktop only, same width as map */}
            <div className="hidden lg:block">
              {/* Benefits Section */}
              <div className="mb-4">
                <BenefitsSection />
              </div>

              {/* Advertising Banner - Not shown here on desktop as it's in sidebar */}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only Promotion Sections - Always at bottom */}
      <div className="lg:hidden container mx-auto px-4 mt-8">
        {/* Benefits Section */}
        <div className="mb-6">
          <BenefitsSection />
        </div>

        {/* Advertising Banner - Always last on mobile */}
        <div className="mb-6">
          <AdvertisingBanner />
        </div>
      </div>
    </div>
  )
}