import React, { useState } from 'react';
import { TableColumn } from './Table';

export interface TableCellProps<T = any> {
  record: T;
  index: number;
  column: TableColumn<T>;
  value: any;
  isSortable?: boolean;
  isSorted?: boolean;
  sortDirection?: 'asc' | 'desc';
  compact?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  onSort?: () => void;
  filterValue?: any;
  onFilterChange?: (value: any) => void;
}

const TableCell = <T extends Record<string, any>>({
  record,
  index,
  column,
  value,
  isSortable = false,
  isSorted = false,
  sortDirection = 'asc',
  compact = false,
  className = '',
  onClick,
  onSort,
  filterValue,
  onFilterChange,
}: TableCellProps<T>) => {
  const [showFilter, setShowFilter] = useState(false);

  // Render cell content
  const renderCellContent = () => {
    if (column.render) {
      return column.render(value, record, index);
    }
    
    // Default rendering based on value type
    if (value === null || value === undefined) {
      return <span className="text-secondary-400">-</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value 
            ? 'bg-success-100 text-success-800' 
            : 'bg-secondary-100 text-secondary-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }
    
    if (typeof value === 'number') {
      return (
        <span className="font-mono">
          {value.toLocaleString()}
        </span>
      );
    }
    
    if (typeof value === 'string' && value.startsWith('http')) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-800 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      );
    }
    
    if (typeof value === 'string' && column.ellipsis && value.length > 50) {
      return (
        <span 
          className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
          title={value}
        >
          {value}
        </span>
      );
    }
    
    return <span>{String(value)}</span>;
  };

  // Handle filter click
  const handleFilterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (column.filterable && onFilterChange) {
      setShowFilter(!showFilter);
    }
  };

  // Handle sort click
  const handleSortClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSortable && onSort) {
      onSort();
    }
  };

  return (
    <td
      className={className}
      onClick={onClick}
      role="cell"
      aria-colindex={column.key}
    >
      <div className="flex items-center space-x-2">
        {/* Sort indicator */}
        {isSortable && (
          <button
            onClick={handleSortClick}
            className={`sort-indicator p-1 rounded hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
              isSorted ? 'text-primary-600' : 'text-secondary-400'
            }`}
            aria-label={`Sort by ${column.title}`}
            aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                isSorted && sortDirection === 'desc' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        )}

        {/* Cell content */}
        <div className="flex-1 min-w-0">
          {renderCellContent()}
        </div>

        {/* Filter indicator */}
        {column.filterable && (
          <button
            onClick={handleFilterClick}
            className={`filter-indicator p-1 rounded hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
              filterValue ? 'text-primary-600' : 'text-secondary-400'
            }`}
            aria-label={`Filter ${column.title}`}
            aria-expanded={showFilter}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Filter input (shown when filter button is clicked) */}
      {column.filterable && showFilter && (
        <div className="mt-2 filter-input-container">
          <input
            type="text"
            placeholder={`Filter ${column.title.toLowerCase()}...`}
            value={filterValue || ''}
            onChange={(e) => onFilterChange?.(e.target.value)}
            className="filter-input w-full px-3 py-2 text-sm border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
            onBlur={() => setTimeout(() => setShowFilter(false), 200)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Filter by ${column.title}`}
          />
        </div>
      )}
    </td>
  );
};

export default TableCell;