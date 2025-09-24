import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { setSelectedPharmacy } from '../store/pharmacySlice'
import { useTranslation } from '../translations'
import LoadingSpinner from './ui/LoadingSpinner'
import { SearchIcon, PhoneIcon, ClockIcon } from './ui/Icons'
import type { Pharmacy } from '../store/slices/types'

interface PharmacyListProps {
  onPharmacySelect?: () => void
}

export default function PharmacyList({ onPharmacySelect }: PharmacyListProps): React.JSX.Element {
  const dispatch = useAppDispatch()
  const { language } = useAppSelector(state => state.ui)
  const { pharmacies, selectedPharmacy, loading } = useAppSelector(state => state.pharmacy)
  const t = useTranslation(language)

  const handlePharmacyClick = (pharmacy: Pharmacy): void => {
    dispatch(setSelectedPharmacy(pharmacy))
    onPharmacySelect?.()
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
              className={`p-5 border-b border-primary-light last:border-b-0 cursor-pointer transition-all duration-300 hover:bg-card-hover hover:shadow-md transform hover:scale-[1.01] ${
                selectedPharmacy?.id === pharmacy.id
                  ? 'bg-primary-lighter border-l-4 border-l-primary shadow-lg ring-2 ring-primary ring-opacity-20'
                  : 'border-l-4 border-l-transparent hover:border-l-primary active:bg-primary-lighter'
              }`}
            >
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