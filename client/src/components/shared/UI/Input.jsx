import React from 'react'

const Input = ({
  label,
  type = 'text',
  error,
  helperText,
  required = false,
  disabled = false,
  loading = false,
  prefix,
  suffix,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const inputClasses = `
    w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 
    focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200
    ${error 
      ? 'border-red-300 focus:ring-red-500 text-red-900' 
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'bg-white'}
    ${prefix ? 'pl-10' : ''}
    ${suffix ? 'pr-10' : ''}
    ${className}
  `.trim()

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{prefix}</span>
          </div>
        )}
        
        <input
          type={type}
          className={inputClasses}
          disabled={disabled || loading}
          required={required}
          {...props}
        />
        
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{suffix}</span>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}

// Specialized input components
export const EmailInput = (props) => (
  <Input type="email" placeholder="email@example.com" {...props} />
)

export const PasswordInput = (props) => (
  <Input type="password" placeholder="••••••••" {...props} />
)

export const PhoneInput = (props) => (
  <Input type="tel" placeholder="+266 1234 5678" {...props} />
)

export const SearchInput = (props) => (
  <Input type="search" placeholder="Search..." {...props} />
)

export default Input