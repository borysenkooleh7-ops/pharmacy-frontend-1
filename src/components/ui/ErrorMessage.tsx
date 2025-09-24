import { ErrorIcon } from './Icons'
import { useAppSelector } from '../../hooks/redux'
import { useTranslation } from '../../translations'

interface ErrorMessageProps {
  error: string | null
  onRetry?: () => void
  className?: string
}

export default function ErrorMessage({ error, onRetry, className = '' }: ErrorMessageProps) {
  const { language } = useAppSelector(state => state.ui)
  const t = useTranslation(language)
  if (!error) return null

  return (
    <div className={`bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-6 shadow-lg ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <ErrorIcon className="w-6 h-6 text-red-500" />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            {t('somethingWentWrong')}
          </h3>
          <p className="text-red-700 leading-relaxed mb-4">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 bg-danger hover:bg-danger-hover active:bg-danger-dark text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              <ErrorIcon className="w-4 h-4" />
              {t('tryAgain')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}