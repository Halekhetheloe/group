import React from 'react'

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'blue',
  className = '',
  text = '' 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
    xlarge: 'h-16 w-16'
  }

  const colorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-600',
    green: 'text-green-600',
    red: 'text-red-600'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg 
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  )
}

// Full page loading spinner
export const PageLoader = ({ text = 'Loading...' }) => (
  <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
    <LoadingSpinner size="large" text={text} />
  </div>
)

// Inline loading spinner for buttons and small areas
export const InlineLoader = ({ size = 'small', color = 'current' }) => (
  <LoadingSpinner size={size} color={color} />
)

// Skeleton loader for content
export const SkeletonLoader = ({ 
  type = 'text',
  count = 1,
  className = '' 
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => i)
  
  const getSkeletonClass = () => {
    switch (type) {
      case 'text':
        return 'h-4 bg-gray-200 rounded'
      case 'title':
        return 'h-6 bg-gray-200 rounded'
      case 'card':
        return 'h-32 bg-gray-200 rounded-lg'
      case 'avatar':
        return 'h-12 w-12 bg-gray-200 rounded-full'
      case 'button':
        return 'h-10 bg-gray-200 rounded'
      default:
        return 'h-4 bg-gray-200 rounded'
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {skeletons.map((_, index) => (
        <div 
          key={index}
          className={`animate-pulse ${getSkeletonClass()}`}
        />
      ))}
    </div>
  )
}

export default LoadingSpinner