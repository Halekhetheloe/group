import React from 'react'

const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'medium',
  bordered = true,
  ...props
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  }

  const classes = `
    bg-white rounded-lg 
    ${bordered ? 'border border-gray-200' : ''}
    ${paddingClasses[padding]}
    ${hover ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : ''}
    ${className}
  `.trim()

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

// Card sub-components
export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`} {...props}>
    {children}
  </div>
)

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
    {children}
  </h3>
)

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`} {...props}>
    {children}
  </p>
)

export const CardBody = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
)

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`} {...props}>
    {children}
  </div>
)

// Pre-configured card types
export const StatsCard = ({ title, value, change, changeType, description, icon, ...props }) => (
  <Card {...props}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change && (
          <p className={`text-sm mt-1 ${
            changeType === 'increase' ? 'text-green-600' : 
            changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {change}
          </p>
        )}
      </div>
      {icon && (
        <div className="p-3 bg-blue-100 rounded-lg">
          {icon}
        </div>
      )}
    </div>
    {description && (
      <p className="text-xs text-gray-500 mt-3">{description}</p>
    )}
  </Card>
)

export const InfoCard = ({ title, description, action, ...props }) => (
  <Card {...props}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    {action && <CardFooter>{action}</CardFooter>}
  </Card>
)

export default Card