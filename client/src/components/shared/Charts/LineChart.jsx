import React from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const LineChart = ({ 
  data, 
  xAxisKey, 
  lineKeys = [], 
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  height = 300,
  showGrid = true,
  showLegend = true,
  strokeWidth = 2,
  title,
  description
}) => {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-0.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span style={{ color: entry.color }}>
                {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
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
              className="w-4 h-0.5 rounded-full"
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
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
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
          
          {lineKeys.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={colors[index % colors.length]}
              strokeWidth={strokeWidth}
              dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>

      {/* No Data State */}
      {(!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">There's no data to display for this chart</p>
        </div>
      )}
    </div>
  )
}

// Pre-configured line charts for common use cases
export const MonthlyApplicationsLineChart = ({ data }) => (
  <LineChart
    data={data}
    xAxisKey="month"
    lineKeys={[
      { key: 'applications', name: 'Total Applications' },
      { key: 'admitted', name: 'Admitted Students' }
    ]}
    colors={['#3B82F6', '#10B981']}
    title="Monthly Application Trends"
    description="Application and admission trends over time"
    height={400}
    strokeWidth={3}
  />
)

export const StudentGrowthLineChart = ({ data }) => (
  <LineChart
    data={data}
    xAxisKey="year"
    lineKeys={[
      { key: 'newStudents', name: 'New Students' },
      { key: 'totalStudents', name: 'Total Students' },
      { key: 'graduated', name: 'Graduated' }
    ]}
    colors={['#3B82F6', '#10B981', '#F59E0B']}
    title="Student Population Growth"
    description="Student enrollment and graduation trends"
    height={400}
  />
)

export const JobPostingsLineChart = ({ data }) => (
  <LineChart
    data={data}
    xAxisKey="month"
    lineKeys={[
      { key: 'postings', name: 'Job Postings' },
      { key: 'applications', name: 'Applications' },
      { key: 'hires', name: 'Successful Hires' }
    ]}
    colors={['#3B82F6', '#F59E0B', '#10B981']}
    title="Job Market Trends"
    description="Monthly job postings and application statistics"
    height={400}
  />
)

export default LineChart