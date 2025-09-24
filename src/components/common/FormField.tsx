import React from 'react'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'number' | 'tel' | 'url' | 'date' | 'textarea' | 'select' | 'checkbox'
  value?: string | number | boolean
  defaultValue?: string | number | boolean
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: { value: string | number; label: string }[]
  rows?: number
  min?: number
  max?: number
  step?: number | string
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  className?: string
  error?: string
  helpText?: string
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  defaultValue,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  rows = 3,
  min,
  max,
  step,
  onChange,
  className = '',
  error,
  helpText
}: FormFieldProps): React.JSX.Element {
  const baseInputClasses = `block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
    error ? 'ring-red-300 focus:ring-red-600' : ''
  } ${disabled ? 'bg-gray-50 text-gray-500' : ''} ${className}`

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            name={name}
            id={name}
            rows={rows}
            defaultValue={defaultValue as string}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            onChange={onChange}
            className={baseInputClasses}
          />
        )

      case 'select':
        return (
          <select
            name={name}
            id={name}
            defaultValue={defaultValue as string}
            required={required}
            disabled={disabled}
            onChange={onChange}
            className={baseInputClasses}
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              name={name}
              id={name}
              defaultChecked={defaultValue as boolean}
              required={required}
              disabled={disabled}
              onChange={onChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor={name} className="ml-2 text-sm text-gray-700">
              {label}
            </label>
          </div>
        )

      default:
        return (
          <input
            type={type}
            name={name}
            id={name}
            defaultValue={defaultValue as string | number}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            onChange={onChange}
            className={baseInputClasses}
          />
        )
    }
  }

  if (type === 'checkbox') {
    return (
      <div className="mb-4">
        {renderInput()}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helpText && (
          <p className="mt-1 text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    )
  }

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium leading-6 text-gray-900 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helpText && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  )
}