import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

// Report generation utilities
export const generateDateRange = (startDate, endDate, interval = 'day') => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(new Date(current));
    
    switch (interval) {
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        current.setDate(current.getDate() + 1);
    }
  }

  return dates;
};

export const formatDateForGrouping = (date, groupBy) => {
  const d = new Date(date);
  
  switch (groupBy) {
    case 'year':
      return d.getFullYear().toString();
    case 'month':
      return d.toISOString().substring(0, 7); // YYYY-MM
    case 'week':
      const year = d.getFullYear();
      const oneJan = new Date(year, 0, 1);
      const numberOfDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000));
      const week = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
      return `${year}-W${week.toString().padStart(2, '0')}`;
    case 'day':
    default:
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }
};

// Data aggregation utilities
export const aggregateData = (data, groupBy, valueField = 'count') => {
  const aggregated = {};

  data.forEach(item => {
    const key = formatDateForGrouping(item.date, groupBy);
    const value = item[valueField] || 1;

    if (!aggregated[key]) {
      aggregated[key] = 0;
    }

    aggregated[key] += value;
  });

  return aggregated;
};

export const calculateGrowthRate = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
};

export const calculateAverage = (values) => {
  if (values.length === 0) return 0;
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

export const calculatePercentage = (part, total) => {
  if (total === 0) return 0;
  return (part / total) * 100;
};

// Statistical utilities
export const calculateStatistics = (data) => {
  if (data.length === 0) {
    return {
      count: 0,
      sum: 0,
      mean: 0,
      median: 0,
      mode: 0,
      min: 0,
      max: 0,
      range: 0,
      standardDeviation: 0
    };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / sorted.length;

  // Median
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;

  // Mode
  const frequency = {};
  let maxFreq = 0;
  let mode = sorted[0];

  sorted.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1;
    if (frequency[val] > maxFreq) {
      maxFreq = frequency[val];
      mode = val;
    }
  });

  // Standard Deviation
  const squaredDiffs = sorted.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / sorted.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    count: sorted.length,
    sum,
    mean,
    median,
    mode,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    range: sorted[sorted.length - 1] - sorted[0],
    standardDeviation
  };
};

// Chart data preparation
export const prepareChartData = (data, options = {}) => {
  const {
    type = 'line',
    xField = 'label',
    yField = 'value',
    sort = true,
    limit
  } = options;

  let chartData = [...data];

  // Sort data if needed
  if (sort) {
    chartData.sort((a, b) => {
      if (type === 'bar' || type === 'column') {
        return b[yField] - a[yField]; // Descending for bars
      }
      return new Date(a[xField]) - new Date(b[xField]); // Ascending for lines by date
    });
  }

  // Apply limit
  if (limit && chartData.length > limit) {
    chartData = chartData.slice(0, limit);
  }

  // Prepare datasets for different chart types
  const datasets = [];

  if (type === 'line' || type === 'bar') {
    datasets.push({
      label: options.label || 'Data',
      data: chartData.map(item => ({
        x: item[xField],
        y: item[yField]
      })),
      backgroundColor: options.backgroundColor || 'rgba(59, 130, 246, 0.1)',
      borderColor: options.borderColor || 'rgba(59, 130, 246, 1)',
      borderWidth: options.borderWidth || 2
    });
  } else if (type === 'pie' || type === 'doughnut') {
    datasets.push({
      data: chartData.map(item => item[yField]),
      backgroundColor: generateColors(chartData.length),
      borderColor: 'white',
      borderWidth: 2
    });
  }

  return {
    labels: chartData.map(item => item[xField]),
    datasets
  };
};

export const generateColors = (count) => {
  const baseColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }

  return colors;
};

// Export utilities
export const exportToCSV = (data, headers) => {
  if (!data || data.length === 0) {
    return '';
  }

  const csvHeaders = headers || Object.keys(data[0]);
  let csv = csvHeaders.join(',') + '\n';

  data.forEach(row => {
    const values = csvHeaders.map(header => {
      let value = row[header];
      
      // Handle nested objects
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value || '';
    });
    
    csv += values.join(',') + '\n';
  });

  return csv;
};

export const exportToJSON = (data, pretty = true) => {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
};

// Filter utilities
export const applyFilters = (data, filters) => {
  return data.filter(item => {
    return Object.entries(filters).every(([key, filter]) => {
      const value = item[key];
      
      if (filter === undefined || filter === null) {
        return true;
      }

      if (typeof filter === 'function') {
        return filter(value);
      }

      if (Array.isArray(filter)) {
        return filter.includes(value);
      }

      return value === filter;
    });
  });
};

export const applyDateRangeFilter = (data, startDate, endDate, dateField = 'date') => {
  if (!startDate && !endDate) {
    return data;
  }

  const start = startDate ? new Date(startDate) : new Date(0);
  const end = endDate ? new Date(endDate) : new Date();

  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= start && itemDate <= end;
  });
};

// Performance monitoring utilities
export const measurePerformance = (operation) => {
  const startTime = process.hrtime();
  
  return {
    start: () => startTime,
    end: () => {
      const endTime = process.hrtime(startTime);
      return (endTime[0] * 1000) + (endTime[1] / 1000000); // Convert to milliseconds
    }
  };
};

export const optimizeQuery = async (query, options = {}) => {
  const { maxResults = 1000, timeout = 30000 } = options;
  
  // Apply limits and timeouts to prevent performance issues
  let optimizedQuery = query.limit(maxResults);
  
  // Add timeout if supported by your database
  // This is a conceptual implementation - actual implementation depends on your database
  
  return optimizedQuery;
};

// Cache utilities for reports
export const cacheReport = async (key, data, ttl = 3600) => {
  // This would typically use Redis or similar caching solution
  // For now, we'll implement a simple in-memory cache
  const cacheItem = {
    data,
    expiresAt: Date.now() + (ttl * 1000)
  };

  // In production, this would be stored in a proper cache
  global.reportCache = global.reportCache || {};
  global.reportCache[key] = cacheItem;

  return true;
};

export const getCachedReport = async (key) => {
  global.reportCache = global.reportCache || {};
  const cacheItem = global.reportCache[key];

  if (!cacheItem) {
    return null;
  }

  if (Date.now() > cacheItem.expiresAt) {
    delete global.reportCache[key];
    return null;
  }

  return cacheItem.data;
};

// Data validation for reports
export const validateReportParameters = (params, schema) => {
  const errors = {};

  Object.keys(schema).forEach(key => {
    const rule = schema[key];
    const value = params[key];

    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[key] = `${key} is required`;
      return;
    }

    if (value !== undefined && value !== null) {
      if (rule.type && typeof value !== rule.type) {
        errors[key] = `${key} must be of type ${rule.type}`;
      }

      if (rule.min !== undefined && value < rule.min) {
        errors[key] = `${key} must be at least ${rule.min}`;
      }

      if (rule.max !== undefined && value > rule.max) {
        errors[key] = `${key} cannot exceed ${rule.max}`;
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors[key] = `${key} has invalid format`;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Common report schemas
export const reportSchemas = {
  dateRange: {
    startDate: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
    endDate: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
    groupBy: { type: 'string', pattern: /^(day|week|month|year)$/ }
  },
  pagination: {
    page: { type: 'number', min: 1 },
    limit: { type: 'number', min: 1, max: 1000 }
  }
};

// Export all utilities
export default {
  generateDateRange,
  formatDateForGrouping,
  aggregateData,
  calculateGrowthRate,
  calculateAverage,
  calculatePercentage,
  calculateStatistics,
  prepareChartData,
  generateColors,
  exportToCSV,
  exportToJSON,
  applyFilters,
  applyDateRangeFilter,
  measurePerformance,
  optimizeQuery,
  cacheReport,
  getCachedReport,
  validateReportParameters,
  reportSchemas
};