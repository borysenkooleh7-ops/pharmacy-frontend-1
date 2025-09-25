import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { Loader } from '@googlemaps/js-api-loader'
import { setSelectedPharmacy, fetchPharmacies, fetchNearbyPharmacies } from '../store/pharmacySlice'
import { deletePharmacy } from '../store/slices/pharmaciesSlice'
import { API_CONFIG } from '../config/api'
import { useTranslation } from '../translations'
import type { Pharmacy } from '../store/slices/types'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

interface MarkerData {
  marker: any
  infoWindow: any
}

export default function GoogleMap(): React.JSX.Element {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<MarkerData[]>([])
  const userMarkerRef = useRef<any>(null)
  const dispatch = useAppDispatch()

  const { pharmacies, selectedCity, selectedPharmacy, filters } = useAppSelector(state => state.pharmacy)
  const { language, userLocation } = useAppSelector(state => state.ui)
  const t = useTranslation(language)

  // Check if user is admin by looking for admin key in sessionStorage
  const isAdmin = (): boolean => {
    try {
      const adminKey = sessionStorage.getItem('adminKey')
      return adminKey === API_CONFIG.ADMIN_KEY
    } catch {
      return false
    }
  }

  // Handle pharmacy deletion for admin users
  const handleDeletePharmacy = async (pharmacyId: number): Promise<void> => {
    console.log('Delete button clicked for pharmacy ID:', pharmacyId)
    console.log('Is admin:', isAdmin())

    // Check if user is admin
    if (!isAdmin()) {
      alert(t('notAuthorized') || 'Not authorized to delete pharmacies')
      return
    }

    // Find the pharmacy to get its name for confirmation
    const pharmacy = pharmacies.find(p => p.id === pharmacyId)
    const pharmacyName = pharmacy ? (language === 'me' ? pharmacy.name_me : (pharmacy.name_en || pharmacy.name_me)) : `ID ${pharmacyId}`

    // Confirm deletion
    if (window.confirm(`${t('confirmDelete') || 'Are you sure you want to delete this pharmacy'}: ${pharmacyName}?`)) {
      try {
        console.log('Attempting to delete pharmacy...')

        // Dispatch the delete action
        await dispatch(deletePharmacy(pharmacyId)).unwrap()

        console.log('Pharmacy deleted successfully')
        alert(t('pharmacyDeletedSuccess') || 'Pharmacy deleted successfully')

        // Refresh the pharmacy list based on current context
        if (selectedCity && !filters.nearby) {
          // If viewing city pharmacies, refresh city pharmacies
          console.log('Refreshing city pharmacies after deletion')
          dispatch(fetchPharmacies({
            params: {
              cityId: selectedCity.id,
              unlimited: true,
              ...filters
            },
            language
          }))
        } else if (filters.nearby && userLocation) {
          // If viewing nearby pharmacies, refresh nearby search
          console.log('Refreshing nearby pharmacies after deletion')
          const defaultRadius = parseInt(import.meta.env.VITE_SEARCH_RADIUS) || 2000
          const defaultLimit = parseInt(import.meta.env.VITE_N_PHARMACIES) || 20

          dispatch(fetchNearbyPharmacies({
            lat: userLocation.latitude,
            lng: userLocation.longitude,
            radius: defaultRadius,
            limit: defaultLimit,
            language
          }))
        } else {
          // If in some other state, reload to refresh
          window.location.reload()
        }

      } catch (error: any) {
        console.error('Delete failed:', error)
        alert(`${t('deletePharmacyFailed') || 'Failed to delete pharmacy'}: ${error.message || t('unknownError') || 'Unknown error'}`)
      }
    }
  }

  // Default coordinates for Podgorica
  const defaultCenter = { lat: 42.4415, lng: 19.2621 }

  const getCenterCoordinates = (): { lat: number; lng: number } => {
    // ALWAYS prioritize user location for map center (anywhere in the world)
    if (userLocation) {
      return {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      }
    }

    // If user selected a city, center on that city's pharmacies
    if (selectedCity) {
      const cityPharmacies = pharmacies.filter(p => {
        if (!p.city_id || p.city_id !== selectedCity.id || !p.lat || !p.lng) {
          return false
        }
        const lat = Number(p.lat)
        const lng = Number(p.lng)
        return !isNaN(lat) && !isNaN(lng)
      })
      if (cityPharmacies.length > 0) {
        return {
          lat: Number(cityPharmacies[0].lat),
          lng: Number(cityPharmacies[0].lng)
        }
      }

      // If city is selected but no pharmacies, use city coordinates if available
      if (selectedCity.latitude && selectedCity.longitude) {
        return {
          lat: selectedCity.latitude,
          lng: selectedCity.longitude
        }
      }
    }

    // Last resort: Montenegro center (only when no user location and no city selected)
    return defaultCenter
  }

  const initializeMap = async (): Promise<void> => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['maps', 'marker', 'streetView']
    })

    try {
      await loader.load()

      const center = getCenterCoordinates()

      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center,
        zoom: 18,
        mapId: 'DEMO_MAP_ID',
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_CENTER,
          mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
        },
        streetViewControl: true,
        streetViewControlOptions: {
          position: google.maps.ControlPosition.RIGHT_TOP
        },
        fullscreenControl: true,
        zoomControl: true,
        rotateControl: true,
        rotateControlOptions: {
          position: google.maps.ControlPosition.LEFT_CENTER
        },
        tilt: 45,
        heading: 0,
        gestureHandling: 'greedy',
        clickableIcons: true,
        isFractionalZoomEnabled: true
      })

      // Enable 45° imagery for satellite and hybrid map types (post-deprecation)
      mapInstanceRef.current.addListener('maptypeid_changed', () => {
        const mapType = mapInstanceRef.current.getMapTypeId()
        if (mapType === 'satellite' || mapType === 'hybrid') {
          mapInstanceRef.current.setTilt(45)
        }
      })

      // Update markers after map is initialized, even if pharmacies array is currently empty
      updateMarkers()
      updateUserLocationMarker()
    } catch (error) {
      console.error('Error loading Google Maps:', error)
    }
  }

  const updateUserLocationMarker = (): void => {
    if (!mapInstanceRef.current || !userLocation) return

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.map = null
      userMarkerRef.current = null
    }

    // Create user position marker with enhanced distinctive style
    const userPosition = {
      lat: userLocation.latitude,
      lng: userLocation.longitude
    }

    // Create custom user location marker with enhanced visibility
    const userMarkerElement = document.createElement('div')
    userMarkerElement.style.position = 'relative'
    userMarkerElement.style.width = '24px'
    userMarkerElement.style.height = '24px'
    userMarkerElement.style.borderRadius = '50%'
    userMarkerElement.style.backgroundColor = '#1976D2' // More distinctive blue
    userMarkerElement.style.border = '4px solid #ffffff'
    userMarkerElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px rgba(25, 118, 210, 0.3)'
    userMarkerElement.style.cursor = 'pointer'

    // Add multiple pulsing rings for better visibility
    const createPulseRing = (size: string, opacity: string, duration: string) => {
      const ring = document.createElement('div')
      ring.style.position = 'absolute'
      ring.style.top = '50%'
      ring.style.left = '50%'
      ring.style.width = size
      ring.style.height = size
      ring.style.borderRadius = '50%'
      ring.style.backgroundColor = `rgba(25, 118, 210, ${opacity})`
      ring.style.transform = 'translate(-50%, -50%)'
      ring.style.animation = `pulse ${duration} infinite`
      return ring
    }

    // Add multiple pulse rings for dramatic effect
    userMarkerElement.appendChild(createPulseRing('50px', '0.4', '2s'))
    userMarkerElement.appendChild(createPulseRing('70px', '0.2', '3s'))

    // Add enhanced pulse animation styles
    if (!document.getElementById('user-location-styles')) {
      const styleSheet = document.createElement('style')
      styleSheet.id = 'user-location-styles'
      styleSheet.innerHTML = `
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.3);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.5);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(styleSheet)
    }

    userMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      position: userPosition,
      map: mapInstanceRef.current,
      content: userMarkerElement,
      title: t('yourLocation') || 'Your Location',
      zIndex: 1000 // High z-index to appear above pharmacy markers
    })

    // Enhanced info window for user location
    userMarkerRef.current.addListener('click', () => {
      // Calculate distance to nearest pharmacy for display
      let nearestDistance = 'calculating...'
      if (pharmacies.length > 0) {
        const distances = pharmacies
          .filter(p => p.lat && p.lng)
          .map(p => {
            const R = 6371
            const dLat = (Number(p.lat) - userLocation.latitude) * Math.PI / 180
            const dLng = (Number(p.lng) - userLocation.longitude) * Math.PI / 180
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(Number(p.lat) * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2)
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          })

        if (distances.length > 0) {
          const minDistance = Math.min(...distances)
          nearestDistance = minDistance < 1 ? `${Math.round(minDistance * 1000)}m` : `${minDistance.toFixed(1)}km`
        }
      }

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; min-width: 250px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <h3 style="margin: 0 0 10px 0; color: #1976d2; font-size: 18px; display: flex; align-items: center;">
              <span style="font-size: 20px; margin-right: 8px;">📍</span>
              ${t('yourLocation') || 'Your Location'}
            </h3>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
              ${t('yourCurrentPosition') || 'This is your current position'}
            </p>
            <div style="background: #f5f5f5; padding: 8px; border-radius: 6px; margin-top: 8px;">
              <p style="margin: 0; color: #333; font-size: 13px;">
                <strong>📋 ${t('showingNearbyPharmacies').replace('{count}', pharmacies.length.toString())}</strong><br>
                <span style="color: #666;">${t('nearestPharmacy')}: ${nearestDistance}</span>
              </p>
            </div>
          </div>
        `
      })
      infoWindow.open(mapInstanceRef.current, userMarkerRef.current)
    })
  }

  const updateMarkers = (): void => {
    if (!mapInstanceRef.current) return

    // Clear existing markers
    markersRef.current.forEach(markerData => markerData.marker.map = null)
    markersRef.current = []

    // Create new markers
    pharmacies.forEach((pharmacy: Pharmacy) => {
      // Skip pharmacies without valid coordinates
      if (!pharmacy.lat || !pharmacy.lng) {
        return
      }

      // Convert to numbers and validate
      const lat = Number(pharmacy.lat)
      const lng = Number(pharmacy.lng)

      if (isNaN(lat) || isNaN(lng)) {
        return
      }

      const position = {
        lat,
        lng
      }

      // Determine marker color based on pharmacy type - using even darker, more distinctive colors
      let markerColor = '#0f379a' // very dark blue-black for default
      let borderColor = '#ffffff'
      let iconColor = '#ffffff'

      if (pharmacy.is_24h) {
        markerColor = '#027d12' // very dark green for 24/7
      } else if (pharmacy.open_sunday) {
        markerColor = '#d51a03' // very dark brown-orange for Sunday open
      }

      // Create container for pulsing effect
      const markerContainer = document.createElement('div')
      markerContainer.style.position = 'relative'
      markerContainer.style.width = '30px'
      markerContainer.style.height = '30px'
      markerContainer.style.display = 'flex'
      markerContainer.style.alignItems = 'center'
      markerContainer.style.justifyContent = 'center'
      markerContainer.style.cursor = 'pointer'

      // Add CSS animation styles to the document if not already added
      if (!document.getElementById('pharmacy-marker-styles')) {
        const styleSheet = document.createElement('style')
        styleSheet.id = 'pharmacy-marker-styles'
        styleSheet.innerHTML = `
          @keyframes pulse-ring {
            0% {
              transform: scale(0.3);
              opacity: 1;
            }
            40% {
              transform: scale(0.7);
              opacity: 0.6;
            }
            100% {
              transform: scale(1);
              opacity: 0;
            }
          }
          @keyframes marker-bounce {
            0%, 100% {
              transform: rotate(45deg) scale(1) translateY(0);
            }
            25% {
              transform: rotate(45deg) scale(1.3) translateY(-2px);
            }
            50% {
              transform: rotate(45deg) scale(1.1) translateY(0);
            }
            75% {
              transform: rotate(45deg) scale(1.25) translateY(-1px);
            }
          }
        `
        document.head.appendChild(styleSheet)
      }

      // Create pulsing ring
      const pulseRing = document.createElement('div')
      pulseRing.style.position = 'absolute'
      pulseRing.style.width = '15px'
      pulseRing.style.height = '15px'
      pulseRing.style.backgroundColor = markerColor
      pulseRing.style.opacity = '0.7'
      pulseRing.style.borderRadius = '50%'
      pulseRing.style.animation = 'pulse-ring 1.5s infinite ease-out'
      pulseRing.style.border = `2px solid ${markerColor}`
      markerContainer.appendChild(pulseRing)

      // Create second pulsing ring with delay
      const pulseRing2 = document.createElement('div')
      pulseRing2.style.position = 'absolute'
      pulseRing2.style.width = '15px'
      pulseRing2.style.height = '15px'
      pulseRing2.style.backgroundColor = markerColor
      pulseRing2.style.opacity = '0.7'
      pulseRing2.style.borderRadius = '50%'
      pulseRing2.style.animation = 'pulse-ring 1.5s infinite ease-out'
      pulseRing2.style.animationDelay = '0.5s'
      pulseRing2.style.border = `2px solid ${markerColor}`
      markerContainer.appendChild(pulseRing2)

      // Create third pulsing ring for more activity
      const pulseRing3 = document.createElement('div')
      pulseRing3.style.position = 'absolute'
      pulseRing3.style.width = '15px'
      pulseRing3.style.height = '15px'
      pulseRing3.style.backgroundColor = markerColor
      pulseRing3.style.opacity = '0.7'
      pulseRing3.style.borderRadius = '50%'
      pulseRing3.style.animation = 'pulse-ring 1.5s infinite ease-out'
      pulseRing3.style.animationDelay = '1s'
      pulseRing3.style.border = `2px solid ${markerColor}`
      markerContainer.appendChild(pulseRing3)

      // Create marker element with pharmacy cross shape
      const markerElement = document.createElement('div')
      markerElement.style.width = '14px'
      markerElement.style.height = '14px'
      markerElement.style.backgroundColor = markerColor
      markerElement.style.border = `2px solid ${borderColor}`
      markerElement.style.position = 'absolute'
      markerElement.style.borderRadius = '3px'
      markerElement.style.transform = 'rotate(45deg)'
      markerElement.style.zIndex = '2'
      markerElement.style.animation = 'marker-bounce 1.2s infinite ease-in-out, marker-glow 2s infinite ease-in-out'

      // Add pharmacy cross icon
      const crossIcon = document.createElement('div')
      crossIcon.innerHTML = '+'
      crossIcon.style.color = iconColor
      crossIcon.style.fontSize = '10px'
      crossIcon.style.fontWeight = '900'
      crossIcon.style.position = 'absolute'
      crossIcon.style.top = '50%'
      crossIcon.style.left = '50%'
      crossIcon.style.transform = 'translate(-50%, -50%) rotate(-45deg)'
      crossIcon.style.lineHeight = '1'
      crossIcon.style.textShadow = `0 0 5px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.6)`
      markerElement.appendChild(crossIcon)

      markerContainer.appendChild(markerElement)

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map: mapInstanceRef.current,
        title: language === 'me' ? pharmacy.name_me : (pharmacy.name_en || pharmacy.name_me),
        content: markerContainer
      })

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(pharmacy)
      })

      marker.addListener('click', () => {
        // Close other info windows
        markersRef.current.forEach(({ infoWindow: iw }: MarkerData) => {
          if (iw) iw.close()
        })

        infoWindow.open({
          map: mapInstanceRef.current,
          anchor: marker
        })

        // Add event listener for delete button after info window opens
        setTimeout(() => {
          const deleteButton = document.getElementById(`delete-pharmacy-${pharmacy.id}`)
          console.log('Looking for delete button with ID:', `delete-pharmacy-${pharmacy.id}`)
          console.log('Delete button found:', !!deleteButton)
          console.log('Is admin check:', isAdmin())

          if (deleteButton && isAdmin()) {
            console.log('Adding click event listener to delete button')
            deleteButton.addEventListener('click', (e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Delete button clicked')
              handleDeletePharmacy(pharmacy.id)
            })
          } else if (deleteButton && !isAdmin()) {
            console.log('Delete button found but user is not admin')
          } else if (!deleteButton) {
            console.log('Delete button not found in DOM')
          }
        }, 100)

        dispatch(setSelectedPharmacy(pharmacy))
      })

      markersRef.current.push({ marker, infoWindow })
    })

    // Adjust map bounds to fit all markers with valid coordinates
    const validPharmacies = pharmacies.filter(pharmacy => {
      if (!pharmacy.lat || !pharmacy.lng) return false
      const lat = Number(pharmacy.lat)
      const lng = Number(pharmacy.lng)
      return !isNaN(lat) && !isNaN(lng)
    })

    if (validPharmacies.length > 0) {
      const bounds = new google.maps.LatLngBounds()

      // Include all pharmacy locations
      validPharmacies.forEach((pharmacy: Pharmacy) => {
        bounds.extend({
          lat: Number(pharmacy.lat),
          lng: Number(pharmacy.lng)
        })
      })

      // IMPORTANT: Also include user location in bounds to show both user and pharmacies
      // Only include user location when it's a nearby search (filters.nearby = true)
      if (userLocation && filters.nearby) {
        bounds.extend({
          lat: userLocation.latitude,
          lng: userLocation.longitude
        })
      }

      mapInstanceRef.current.fitBounds(bounds)

      // Restore tilt after fitBounds() - fitBounds resets tilt to 0
      setTimeout(() => {
        const currentMapType = mapInstanceRef.current.getMapTypeId()
        if (currentMapType === 'satellite' || currentMapType === 'hybrid') {
          mapInstanceRef.current.setTilt(45)
        }
      }, 100)
    }
  }

  const createInfoWindowContent = (pharmacy: Pharmacy): string => {
    const name = language === 'me' ? pharmacy.name_me : (pharmacy.name_en || pharmacy.name_me)
    const badges = []

    if (pharmacy.is_24h) {
      badges.push('<span class="bg-green-500 text-white px-2 py-1 text-xs rounded-full">24/7</span>')
    }
    if (pharmacy.open_sunday) {
      badges.push(`<span class="bg-orange-500 text-white px-2 py-1 text-xs rounded-full">${t('openSunday')}</span>`)
    }

    const adminDeleteButton = isAdmin() ?
      `<button
         id="delete-pharmacy-${pharmacy.id}"
         class="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded-md transition-colors duration-200"
         style="cursor: pointer;">
         🗑️ ${t('delete')}
       </button>` : ''

    return `
      <div class="p-3 max-w-xs">
        <h3 class="font-semibold text-gray-800 mb-2">${name}</h3>
        <p class="text-sm text-gray-600 mb-2">${pharmacy.address}</p>
        <div class="mb-2">${badges.join(' ')}</div>
        <div class="text-xs text-gray-500">
          <p><strong>${t('workingTime')}:</strong> ${pharmacy.hours_monfri}</p>
          ${pharmacy.phone ? `<p><strong>${t('phone')}:</strong> ${pharmacy.phone}</p>` : ''}
          ${pharmacy.website ? `<p><a href="${pharmacy.website}" target="_blank" class="text-blue-600 hover:underline">${t('website')}</a></p>` : ''}
        </div>
        ${adminDeleteButton}
      </div>
    `
  }

  useEffect(() => {
    // Initialize map when we have either user location or selected city
    const initTimer = setTimeout(() => {
      if (mapRef.current && GOOGLE_MAPS_API_KEY && (userLocation || selectedCity)) {
        initializeMap()
      }
    }, 100)

    return () => {
      clearTimeout(initTimer)
      markersRef.current.forEach(({ marker }: MarkerData) => {
        if (marker) marker.map = null
      })
      markersRef.current = []
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null
        userMarkerRef.current = null
      }
    }
  }, [selectedCity, pharmacies, userLocation])

  useEffect(() => {
    if (mapInstanceRef.current) {
      // Always update markers when pharmacies data changes, even if empty
      updateMarkers()
      // Also update user location marker
      updateUserLocationMarker()
    }
  }, [pharmacies, language, userLocation])

  // Additional effect to handle the case where map initializes before pharmacy data loads
  useEffect(() => {
    if (mapInstanceRef.current && pharmacies.length > 0) {
      // Update markers when pharmacies become available after map initialization
      updateMarkers()
    }
  }, [pharmacies.length])

  useEffect(() => {
    if (mapInstanceRef.current) {
      const center = getCenterCoordinates()
      mapInstanceRef.current.setCenter(center)

      // Update user location marker when location changes
      updateUserLocationMarker()

      // Preserve tilt when changing location
      setTimeout(() => {
        const currentMapType = mapInstanceRef.current.getMapTypeId()
        if (currentMapType === 'satellite' || currentMapType === 'hybrid') {
          mapInstanceRef.current.setTilt(45)
        }
      }, 100)
    }
  }, [selectedCity])

  // Focus on selected pharmacy
  useEffect(() => {
    if (selectedPharmacy && mapInstanceRef.current) {
      const position = {
        lat: selectedPharmacy.lat || 0,
        lng: selectedPharmacy.lng || 0
      }
      mapInstanceRef.current.setCenter(position)
      mapInstanceRef.current.setZoom(15)

      // Preserve tilt when focusing on pharmacy
      setTimeout(() => {
        const currentMapType = mapInstanceRef.current.getMapTypeId()
        if (currentMapType === 'satellite' || currentMapType === 'hybrid') {
          mapInstanceRef.current.setTilt(45)
        }
      }, 100)

      // Open the corresponding info window
      const markerData = markersRef.current.find(({ marker }: MarkerData) => {
        const markerPos = marker.position
        return Math.abs(markerPos.lat - position.lat) < 0.0001 &&
               Math.abs(markerPos.lng - position.lng) < 0.0001
      })

      if (markerData) {
        // Close other info windows
        markersRef.current.forEach(({ infoWindow }: MarkerData) => {
          if (infoWindow) infoWindow.close()
        })
        markerData.infoWindow.open(mapInstanceRef.current, markerData.marker)
      }
    }
  }, [selectedPharmacy])

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-[700px] bg-gray-100 transition-all duration-300 rounded-lg flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <div className="text-4xl mb-2">🗺️</div>
          <p>Google Maps API key not configured</p>
          <p className="text-sm mt-1">Add VITE_GOOGLE_MAPS_API_KEY to .env</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-[700px] bg-gray-100 transition-all duration-300 rounded-lg"
    />
  )
}