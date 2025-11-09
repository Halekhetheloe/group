import React from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const BarChart = ({ 
  data, 
  xAxisKey, 
  barKeys = [], 
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  height = 300,
  showGrid = true,
  showLegend = true,
  stacked = false,
  title,
  description
}) => {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Custom legend
  const renderLegend = (props) => {
    const { payload } = props
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Chart Header */}
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      )}

      {/* Chart Container */}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
          <XAxis 
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={renderLegend} />}
          
          {barKeys.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>

      {/* No Data State */}
      {(!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">There's no data to display for this chart</p>
        </div>
      )}
    </div>
  )
}

// Pre-configured bar charts for common use cases
export const ApplicationsBarChart = ({ data }) => (
  <BarChart
    data={data}
    xAxisKey="month"
    barKeys={[
      { key: 'applications', name: 'Applications' },
      { key: 'admitted', name: 'Admitted' },
      { key: 'rejected', name: 'Rejected' }
    ]}
    colors={['#3B82F6', '#10B981', '#EF4444']}
    title="Applications Overview"
    description="Monthly application statistics and outcomes"
    height={400}
  />
)

export const EnrollmentBarChart = ({ data }) => (
  <BarChart
    data={data}
    xAxisKey="institution"
    barKeys={[
      { key: 'enrolled', name: 'Enrolled Students' },
      { key: 'capacity', name: 'Total Capacity' }
    ]}
    colors={['#8B5CF6', '#F59E0B']}
    title="Enrollment vs Capacity"
    description="Comparison of enrolled students against institutional capacity"
    height={350}
  />
)

export const JobApplicationsBarChart = ({ data }) => (
  <BarChart
    data={data}
    xAxisKey="company"
    barKeys={[
      { key: 'applications', name: 'Total Applications' },
      { key: 'shortlisted', name: 'Shortlisted' },
      { key: 'hired', name: 'Hired' }
    ]}
    colors={['#3B82F6', '#F59E0B', '#10B981']}
    title="Job Applications by Company"
    description="Application and hiring statistics across partner companies"
    height={400}
  />
)

export default BarChart