import { useTranslation } from '../translations'
import { useAppSelector } from '../hooks/redux'
import PharmacySubmissionForm from '../components/PharmacySubmissionForm'

export default function SubmitPharmacyPage(): React.JSX.Element {
  const { language } = useAppSelector(state => state.ui)
  const t = useTranslation(language)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          {t('addPharmacy')}
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          {t('addPharmacyDescription')}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <PharmacySubmissionForm />
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-background-secondary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          {t('submissionInfo')}
        </h2>
        <div className="space-y-3 text-text-secondary">
          <p>• {t('submissionReview')}</p>
          <p>• {t('submissionAccuracy')}</p>
          <p>• {t('submissionContact')}</p>
        </div>
      </div>
    </div>
  )
}