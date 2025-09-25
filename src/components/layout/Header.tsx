import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setLanguage } from '../../store/uiSlice'
import { setSelectedCity } from '../../store/pharmacySlice'
import { useTranslation } from '../../translations'
import { LocationIcon } from '../ui/Icons'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import type { City, UserLocation } from '../../store/slices/types'

export default function Header(): React.JSX.Element {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [geoLocation, setGeoLocation] = useState<UserLocation | null>(null)
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false)
  const { language } = useAppSelector(state => state.ui)
  const { cities, selectedCity, loading } = useAppSelector(state => state.pharmacy)
  const t = useTranslation(language)
  
  const handleLanguageChange = (newLang: 'me' | 'en'): void => {
    dispatch(setLanguage(newLang))
  }

  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const cityId = parseInt(event.target.value)
    const city = cities.find((c: City) => c.id === cityId)
    if (city) {
      dispatch(setSelectedCity(city))
    }
  }


  const detectLocation = async () => {
    if (!navigator.geolocation) {
      alert(t('geolocationNotSupported') || 'Geolocation is not supported by this browser.')
      return
    }

    setLoadingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setGeoLocation({ latitude, longitude })

        // Find nearest city based on coordinates
        const nearestCity = findNearestCity(latitude, longitude, cities)
        if (nearestCity && nearestCity.id !== selectedCity?.id) {
          dispatch(setSelectedCity(nearestCity))
        }

        setLoadingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setLoadingLocation(false)
        let message = t('geolocationError') || 'Unable to detect your location.'
        if (error.code === error.PERMISSION_DENIED) {
          message = t('geolocationDenied') || 'Location access was denied. Please enable location services.'
        }
        alert(message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  // Simple distance calculation to find nearest city
  const findNearestCity = (lat: number, lng: number, cityList: City[]): City | null => {
    if (!cityList || cityList.length === 0) return null

    let nearestCity: City | null = null
    let minDistance = Infinity

    cityList.forEach(city => {
      if (city.latitude && city.longitude) {
        const distance = getDistance(lat, lng, city.latitude, city.longitude)
        if (distance < minDistance) {
          minDistance = distance
          nearestCity = city
        }
      }
    })

    return nearestCity
  }

  // Haversine formula for distance calculation
  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  return (
    <header className="bg-gradient-to-r from-[#6495ed] to-[#6495ed] shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-6 py-6">
        {/* Top Row - Logo and Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex flex-col lg:flex-row items-center gap-6 cursor-pointer">
            <button
             onClick={() => navigate("/")} className="text-center lg:text-left">
              <h1 className="text-xl lg:text-4xl font-black relative perspective-1000" style={{fontFamily: 'Orbitron, Exo 2, Rajdhani, Inter, sans-serif', perspective: '1000px'}}>
                {/* Main Text with Enhanced 3D Effects */}
                <span
                  className="relative z-10 bg-gradient-to-r from-[#ffd] to-[#fff] bg-clip-text text-transparent cursor-pointer"
                >
                  Apoteka24.me
                </span>
              </h1>
              <p className="px-10 lg:px-0 text-md text-[#fff]">{t('slogan')}</p>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* City Selector with Location Detection */}
            <div className="flex items-center gap-3">
              <select
                value={selectedCity?.id || ''}
                onChange={handleCityChange}
                disabled={loading.cities}
                className="px-4 py-3 border-2 border-white/20 rounded-lg bg-white/10 backdrop-blur text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 disabled:opacity-50 transition-all duration-200"
              >
                <option value="" className="text-text-primary">{loading.cities ? t('loading') : t('selectCity')}</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id} className="text-text-primary">
                    {language === 'me' ? city.name_me : (city.name_en || city.name_me)}
                  </option>
                ))}
              </select>

              <button
                onClick={detectLocation}
                disabled={loadingLocation || loading.cities}
                className="p-3 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded-lg transition-all duration-200 transform disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur border border-white/20 hover:border-white/40 shadow-button hover:shadow-button-hover hover:scale-105 active:scale-95"
                title={t('detectLocation') || 'Detect my location'}
              >
                <LocationIcon className={`w-5 h-5 ${loadingLocation ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex bg-white/20 backdrop-blur rounded-lg overflow-hidden border border-white/20">
              <button
                onClick={() => handleLanguageChange('me')}
                className={`px-4 py-3 text-sm font-medium transition-all duration-200 transform ${
                  language === 'me'
                    ? 'bg-white text-primary shadow-sm ring-2 ring-white ring-opacity-50'
                    : 'text-white hover:bg-white/20 active:bg-white/30 hover:scale-105 active:scale-95'
                }`}
              >
                ME
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-4 py-3 text-sm font-medium transition-all duration-200 transform ${
                  language === 'en'
                    ? 'bg-white text-primary shadow-sm ring-2 ring-white ring-opacity-50'
                    : 'text-white hover:bg-white/20 active:bg-white/30 hover:scale-105 active:scale-95'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

      </div>
    </header>
  )
}