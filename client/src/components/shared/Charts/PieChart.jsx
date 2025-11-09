import React from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const PieChart = ({ 
  data, 
  dataKey = 'value',
  nameKey = 'name',
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'],
  height = 300,
  innerRadius = 0,
  outerRadius = 80,
  showLegend = true,
  showLabel = false,
  title,
  description
}) => {
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.payload[nameKey]}</p>
          <p className="text-sm" style={{ color: data.color }}>
            {data.name}: {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
            {data.payload.percentage && ` (${data.payload.percentage}%)`}
          </p>
        </div>
      )
    }
    return null
  }

  // Custom label
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (!showLabel) return null
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // Custom legend
  const renderLegend = (props) => {
    const { payload } = props
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.value}</span>
            <span className="text-sm text-gray-400">
              ({((entry.payload.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item[dataKey], 0)

  // Enhance data with percentages
  const enhancedData = data.map(item => ({
    ...item,
    percentage: ((item[dataKey] / total) * 100).toFixed(1)
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Chart Header */}
      {(title || description) && (
        <div className="mb-6 text-center">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      )}

      {/* Chart Container */}
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={height}>
          <RechartsPieChart>
            <Pie
              data={enhancedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {enhancedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend content={renderLegend} />}
          </RechartsPieChart>
        </ResponsiveContainer>

        {/* Summary Statistics */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{data.length}</div>
            <div className="text-xs text-gray-600">Categories</div>
          </div>
        </div>
      </div>

      {/* No Data State */}
      {(!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="text-4xl mb-2">🥧</div>
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">There's no data to display for this chart</p>
        </div>
      )}
    </div>
  )
}

// Pre-configured pie charts for common use cases
export const ApplicationStatusPieChart = ({ data }) => (
  <PieChart
    data={data}
    dataKey="count"
    nameKey="status"
    colors={['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6']}
    title="Application Status Distribution"
    description="Breakdown of applications by current status"
    height={400}
    showLabel={true}
  />
)

export const CourseEnrollmentPieChart = ({ data }) => (
  <PieChart
    data={data}
    dataKey="students"
    nameKey="course"
    colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']}
    title="Course Enrollment Distribution"
    description="Student enrollment across different courses"
    height={400}
    innerRadius={40}
  />
)

export const JobCategoryPieChart = ({ data }) => (
  <PieChart
    data={data}
    dataKey="jobs"
    nameKey="category"
    colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
    title="Job Categories Distribution"
    description="Available jobs by category across partner companies"
    height={350}
    showLabel={true}
  />
)

export const InstitutionDistributionPieChart = ({ data }) => (
  <PieChart
    data={data}
    dataKey="students"
    nameKey="institution"
    colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
    title="Student Distribution by Institution"
    description="Student enrollment across partner institutions"
    height={400}
    innerRadius={60}
    outerRadius={100}
  />
)

export default PieChart