import { useAppSelector } from '../hooks/redux'
import { useTranslation } from '../translations'
import { AllPharmaciesIcon, AccurateIcon, FiltersIcon } from './ui/Icons'
import { Link, useNavigate } from 'react-router-dom'

export default function BenefitsSection(): React.JSX.Element {
  const { language } = useAppSelector(state => state.ui)
  const t = useTranslation(language)
  const navigate = useNavigate()

  const benefits = [
    {
      icon: <AllPharmaciesIcon className="w-8 h-8" />,
      titleKey: 'benefit1Title',
      textKey: 'benefit1Text'
    },
    {
      icon: <AccurateIcon className="w-8 h-8" />,
      titleKey: 'benefit2Title',
      textKey: 'benefit2Text'
    },
    {
      icon: <FiltersIcon className="w-8 h-8" />,
      titleKey: 'benefit3Title',
      textKey: 'benefit3Text'
    }
  ]

  return (
    <div className="bg-card border border-primary-light rounded-xl shadow-lg p-10 hover:border-primary hover:shadow-xl transition-all duration-300 mt-2">
      <div className="text-center mb-12">
        <h2 className=" text-xl lg:text-3xl font-bold text-text-primary mb-4">
          {t('benefitsTitle')}
        </h2>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
          {t('benefitsSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {benefits.map((benefit, index) => (
          <div key={index} className="text-center group">
            <div className={`inline-flex items-center justify-center w-20 h-20 ${
              index === 0 ? 'bg-primary' :
              index === 1 ? 'bg-success' : 'bg-warning'
            } rounded-2xl mb-6 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg`}>
              <div className="text-white group-hover:scale-110 transition-transform duration-300">
                {benefit.icon}
              </div>
            </div>
            <h3 className="text-xl font-bold mb-4 text-text-primary">
              {t(benefit.titleKey)}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {t(benefit.textKey)}
            </p>
          </div>
        ))}
      </div>

      {/* Action Buttons Section */}
      <div className="mt-16 pt-10 border-t border-gray-200">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-text-primary mb-3">
            {t('addPharmacySection')}
          </h3>
          <p className="text-text-secondary">
            {t('addPharmacySectionDesc')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {/* Submit Pharmacy Button */}
          <button
            onClick={() => navigate('/submit')}
            className="group flex items-center gap-4 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <div className="p-2 bg-white text-[#777] bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-lg font-bold">
                {t('addPharmacyButton')}
              </div>
              <div className="text-sm opacity-90">
                {t('addPharmacyDesc')}
              </div>
            </div>
          </button>

          {/* Admin Panel Button */}
          {/* <button
            onClick={()=> navigate("/admin")}
            className="group flex items-center gap-4 bg-secondary hover:bg-secondary-dark text-white font-semibold px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <div className="p-2 bg-white text-[#777] bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-lg font-bold">
                {language === 'me' ? 'Admin Panel' : 'Admin Panel'}
              </div>
              <div className="text-sm opacity-90">
                {language === 'me' ? 'Upravljaj sistemom' : 'Manage the system'}
              </div>
            </div>
          </button> */}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-text-tertiary">
            {t('adminRequiresAuth')}
          </p>
        </div>
      </div>
    </div>
  )
}