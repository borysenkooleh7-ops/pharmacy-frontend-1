import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { useTranslation } from '../translations'
import LoadingSpinner from './ui/LoadingSpinner'
import { SearchIcon, PhoneIcon, ClockIcon } from './ui/Icons'
import type { Pharmacy } from '../store/slices/types'
import { API_CONFIG } from '../config/api'
import { deletePharmacy } from '../store/slices/pharmaciesSlice'
import { setSelectedPharmacy, fetchPharmacies, fetchNearbyPharmacies } from '../store/pharmacySlice'

interface PharmacyListProps {
  onPharmacySelect?: () => void
}

export default function PharmacyList({ onPharmacySelect }: PharmacyListProps): React.JSX.Element {
  const dispatch = useAppDispatch()
  const { language, userLocation } = useAppSelector(state => state.ui)
  const { pharmacies, selectedCity,  selectedPharmacy, loading, filters } = useAppSelector(state => state.pharmacy)
  const t = useTranslation(language)

  const handlePharmacyClick = (pharmacy: Pharmacy): void => {
    dispatch(setSelectedPharmacy(pharmacy))
    onPharmacySelect?.()
  }

  const handleDeletePharmacy = async (pharmacyId: number): Promise<void> => {
    const isAdmin = (): boolean => {
      try {
        const adminKey = sessionStorage.getItem('adminKey')
        return adminKey === API_CONFIG.ADMIN_KEY
      } catch {
        return false
      }
    }

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


  if (loading.pharmacies) {
    return (
      <div className="bg-card border border-primary-light rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-primary-light bg-gradient-to-r from-primary-lighter to-background-secondary">
          <h3 className="text-xl font-semibold text-text-primary">
{t('pharmaciesList')}
          </h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
          <span className="ml-3 text-text-secondary">{t('loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-primary-light rounded-xl shadow-lg">
      <div className="p-6 border-b border-primary-light bg-gradient-to-r from-primary-lighter to-background-secondary">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-text-primary">
{t('pharmaciesList')}
          </h3>
          <span className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md">
            {pharmacies.length}
          </span>
        </div>
      </div>

      <div className="max-h-screen overflow-y-auto overflow-x-hidden">
        {pharmacies.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">
            <div className="w-16 h-16 mx-auto mb-6 bg-background-tertiary rounded-full flex items-center justify-center border border-primary-light">
              <SearchIcon className="w-6 h-6 text-text-tertiary" />
            </div>
            <p className="font-medium text-text-secondary">{t('noPharmaciesFound')}</p>
          </div>
        ) : (
          pharmacies.map((pharmacy: Pharmacy) => (
            <div
              key={pharmacy.id}
              onClick={() => handlePharmacyClick(pharmacy)}
              className={`relative p-5 border-b border-primary-light last:border-b-0 cursor-pointer transition-all duration-300 hover:bg-card-hover hover:shadow-md transform hover:scale-[1.01] ${
                selectedPharmacy?.id === pharmacy.id
                  ? 'bg-primary-lighter border-l-4 border-l-primary shadow-lg ring-2 ring-primary ring-opacity-20'
                  : 'border-l-4 border-l-transparent hover:border-l-primary active:bg-primary-lighter'
              }`}
            >
              {/* <button className="absolute mt-18 ml-42 bg-[#f66] rounded-[10px] hover:bg-red-600 text-white text-sm px-3 py-1  duration-200"
              onClick = {() => handleDeletePharmacy(pharmacy.id)}
              >
                🗑️ delete
              </button> */}
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-text-primary leading-tight text-lg">
                  {language === 'me' ? pharmacy.name_me : (pharmacy.name_en || pharmacy.name_me)}
                </h4>
                <div className="flex gap-2 ml-3 flex-shrink-0">
                  {pharmacy.is_24h && (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-success text-white rounded-full shadow-sm">
                      24/7
                    </span>
                  )}
                  {pharmacy.open_sunday && (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-warning text-white rounded-full shadow-sm">
                      Sun
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-text-secondary mb-4 leading-relaxed">{pharmacy.address}</p>

              <div className="space-y-2 text-sm text-text-secondary">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-4 h-4 flex-shrink-0 text-primary" />
                  <span>{pharmacy.hours_monfri || t('hoursNotAvailable')}</span>
                </div>
                {pharmacy.phone && (
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="w-4 h-4 flex-shrink-0 text-success" />
                    <span>{pharmacy.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}