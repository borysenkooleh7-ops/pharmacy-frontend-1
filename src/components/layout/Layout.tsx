import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchCities, setSelectedCity } from '../../store/pharmacySlice'
import { fetchActiveAds } from '../../store/adSlice'
import Header from './Header'
import ErrorBoundary from '../ui/ErrorBoundary'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  const dispatch = useAppDispatch()
  const { cities, selectedCity } = useAppSelector(state => state.pharmacy)
  const { language } = useAppSelector(state => state.ui)

  // Load initial data
  useEffect(() => {
    dispatch(fetchCities(language))
    dispatch(fetchActiveAds(language))
  }, [dispatch, language])

  // Set default city to Podgorica when cities are loaded
  useEffect(() => {
    if (cities.length > 0 && !selectedCity) {
      // Find Podgorica (should be default according to requirements)
      const podgorica = cities.find(city => city.slug === 'podgorica')
      if (podgorica) {
        dispatch(setSelectedCity(podgorica))
      } else {
        // Fallback to first city if Podgorica not found
        dispatch(setSelectedCity(cities[0]))
      }
    }
  }, [cities, selectedCity, dispatch])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-2">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  )
}