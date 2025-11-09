import React from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onSort,
  sortBy,
  sortDirection,
  className = '',
  ...props
}) => {
  const handleSort = (columnKey) => {
    if (onSort && columns.find(col => col.key === columnKey)?.sortable) {
      onSort(columnKey)
    }
  }

  const renderHeader = () => (
    <thead className="bg-gray-50">
      <tr>
        {columns.map((column) => {
          const isSorted = sortBy === column.key
          const canSort = column.sortable && onSort
          
          return (
            <th
              key={column.key}
              className={`
                px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                ${canSort ? 'cursor-pointer hover:bg-gray-100' : ''}
                ${column.className || ''}
              `.trim()}
              onClick={() => canSort && handleSort(column.key)}
            >
              <div className="flex items-center space-x-1">
                <span>{column.title}</span>
                {canSort && (
                  <div className="flex flex-col">
                    <ChevronUp 
                      className={`h-3 w-3 ${
                        isSorted && sortDirection === 'asc' 
                          ? 'text-blue-600' 
                          : 'text-gray-300'
                      }`} 
                    />
                    <ChevronDown 
                      className={`h-3 w-3 -mt-1 ${
                        isSorted && sortDirection === 'desc' 
                          ? 'text-blue-600' 
                          : 'text-gray-300'
                      }`} 
                    />
                  </div>
                )}
              </div>
            </th>
          )
        })}
      </tr>
    </thead>
  )

  const renderBody = () => {
    if (loading) {
      return (
        <tbody>
          {[...Array(5)].map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-200">
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      )
    }

    if (!data || data.length === 0) {
      return (
        <tbody>
          <tr>
            <td 
              colSpan={columns.length} 
              className="px-6 py-12 text-center text-gray-500"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="text-4xl">📊</div>
                <p className="text-lg font-medium">{emptyMessage}</p>
                <p className="text-sm">No records found</p>
              </div>
            </td>
          </tr>
        </tbody>
      )
    }

    return (
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((row, rowIndex) => (
          <tr 
            key={rowIndex} 
            className="hover:bg-gray-50 transition-colors duration-150"
          >
            {columns.map((column) => (
              <td 
                key={column.key} 
                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
              >
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    )
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`} {...props}>
        {renderHeader()}
        {renderBody()}
      </table>
    </div>
  )
}

// Table sub-components
export const TableContainer = ({ children, className = '' }) => (
  <div className={`overflow-x-auto ${className}`}>
    {children}
  </div>
)

export const TableFooter = ({ children, className = '' }) => (
  <div className={`bg-white px-6 py-3 border-t border-gray-200 ${className}`}>
    {children}
  </div>
)

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems,
  itemsPerPage,
  className = '' 
}) => {
  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="text-sm text-gray-700">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
      
      <div className="flex space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn-secondary text-sm disabled:opacity-50"
        >
          Previous
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`btn-secondary text-sm min-w-[40px] ${
              currentPage === page ? 'bg-blue-600 text-white border-blue-600' : ''
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn-secondary text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Table