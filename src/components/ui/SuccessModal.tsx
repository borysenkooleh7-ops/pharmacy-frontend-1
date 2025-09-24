import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../hooks/redux'
import { useTranslation } from '../../translations'

interface SuccessModalProps {
  isOpen: boolean
  title: string
  message: string
  autoRedirectSeconds?: number
  onClose: () => void
  onGoHome?: () => void
  onSubmitAgain?: () => void
}

export default function SuccessModal({
  isOpen,
  title,
  message,
  autoRedirectSeconds = 5,
  onClose,
  onGoHome,
  onSubmitAgain
}: SuccessModalProps): React.JSX.Element | null {
  const navigate = useNavigate()
  const { language } = useAppSelector(state => state.ui)
  const t = useTranslation(language)
  const [countdown, setCountdown] = useState(autoRedirectSeconds)

  useEffect(() => {
    if (!isOpen) {
      setCountdown(autoRedirectSeconds)
      return
    }

    // Start countdown
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handleGoHome()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, autoRedirectSeconds])

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome()
    } else {
      navigate('/')
    }
    onClose()
  }

  const handleSubmitAgain = () => {
    if (onSubmitAgain) {
      onSubmitAgain()
    }
    onClose()
  }

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ease-out"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl">
                ✓
              </div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

          {/* Countdown */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {countdown}
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {t('autoRedirectingIn').replace('{count}', countdown.toString())}
                </p>
                <p className="text-xs text-blue-600">
                  {t('youCanCancelByClicking')}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGoHome}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {t('goToHome')}
            </button>

            <button
              onClick={handleSubmitAgain}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('submitAgain')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}