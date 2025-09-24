import { LoadingIcon } from './Icons'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <LoadingIcon className={`animate-spin text-primary ${sizeClasses[size]} ${className}`} />
      <div className={`absolute inset-0 rounded-full border-2 border-primary-light border-opacity-30 animate-pulse ${sizeClasses[size]}`}></div>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-64 py-12">
      <div className="text-center">
        <div className="relative mb-6">
          <LoadingSpinner size="xl" className="mx-auto" />
          <div className="absolute inset-0 rounded-full border-4 border-primary-light border-opacity-20 animate-ping"></div>
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Loading...</h3>
        <p className="text-text-secondary">Please wait while we fetch the latest data</p>
        <div className="flex justify-center mt-4 space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  )
}