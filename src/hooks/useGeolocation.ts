import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUserLocation } from '../store/uiSlice'
import { setLoadingLocation } from '../store/uiSlice'

export const useGeolocation = () => {
  const dispatch = useDispatch()
  const [error, setError] = useState(null)

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    dispatch(setLoadingLocation(true))
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        dispatch(setUserLocation(location))
        dispatch(setLoadingLocation(false))
      },
      (error) => {
        let errorMessage = 'Unable to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }
        setError(errorMessage)
        dispatch(setLoadingLocation(false))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    )
  }

  return {
    getCurrentLocation,
    error,
  }
}