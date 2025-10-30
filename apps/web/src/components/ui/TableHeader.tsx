import React from 'react';
import { TableColumn } from './Table';

export interface TableHeaderProps<T = any> {
  columns: TableColumn<T>[];
  sortConfig?: {
    columnKey: string;
    direction: 'asc' | 'desc';
  } | null;
  onSort?: (columnKey: string) => void;
  filterValues?: Record<string, any>;
  onFilterChange?: (columnKey: string, value: any) => void;
  selection?: {
    selectedRowKeys?: string[] | number[];
    onChange?: (selectedRowKeys: string[] | number[], selectedRows: T[]) => void;
    getCheckboxProps?: (record: T) => { disabled?: boolean };
  };
  selectedRowKeys?: string[] | number[];
  onSelectionChange?: (keys: string[] | number[]) => void;
  data?: T[];
  getRowKey?: (record: T, index: number) => string | number;
  className?: string;
  compact?: boolean;
}

const TableHeader = <T extends Record<string, any>>({
  columns,
  sortConfig,
  onSort,
  filterValues = {},
  onFilterChange,
  selection,
  selectedRowKeys = [],
  data = [],
  getRowKey = () => 0,
  className = '',
  compact = false,
}: TableHeaderProps<T>) => {
  const handleSelectAll = (checked: boolean) => {
    if (!selection?.onChange) return;

    const allKeys = data.map((record, index) => getRowKey(record, index));
    const availableKeys = data
      .map((record, index) => ({ key: getRowKey(record, index), record }))
      .filter(({ record }) => {
        const checkboxProps = selection.getCheckboxProps?.(record);
        return !checkboxProps?.disabled;
      })
      .map(({ key }) => key);

    if (checked) {
      const newSelectedKeys = [...new Set([...selectedRowKeys, ...availableKeys])];
      selection.onChange(newSelectedKeys, data);
    } else {
      const newSelectedKeys = selectedRowKeys.filter(key => !availableKeys.includes(key));
      selection.onChange(newSelectedKeys, data);
    }
  };

  const isAllSelected = data.length > 0 && data.every((record, index) => {
    const key = getRowKey(record, index);
    return selectedRowKeys.includes(key);
  });

  const isIndeterminate = data.length > 0 && 
    !isAllSelected && 
    data.some((record, index) => {
      const key = getRowKey(record, index);
      return selectedRowKeys.includes(key);
    });

  return (
    <thead className={`table-header ${className}`}>
      <tr>
        {selection && (
          <th className={`table-header-cell selection-cell ${compact ? 'py-2' : 'py-4'} px-4`}>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isIndeterminate;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                aria-label="Select all rows"
              />
            </div>
          </th>
        )}
        
        {columns.map((column) => {
          const isSorted = sortConfig?.columnKey === column.key;
          const isSortable = column.sortable;
          const filterValue = filterValues[column.key];
          const isFilterable = column.filterable;

          const cellClasses = [
            'table-header-cell',
            `text-${column.align || 'left'}`,
            column.sticky ? 'sticky top-0 z-10 bg-white' : '',
            column.className || '',
            compact ? 'py-2' : 'py-4',
            'px-4',
            'border-b border-secondary-200',
            'font-medium text-secondary-900',
            'text-sm',
            'whitespace-nowrap'
          ].filter(Boolean).join(' ');

          return (
            <th
              key={column.key}
              className={cellClasses}
              style={{ width: column.width }}
              role="columnheader"
              aria-sort={
                isSortable 
                  ? isSorted 
                    ? sortConfig?.direction === 'asc' 
                      ? 'ascending' 
                      : 'descending'
                    : 'none'
                  : undefined
              }
            >
              <div className={`flex items-${column.align || 'left'} ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="header-title">{column.title}</span>
                    
                    {isSortable && (
                      <button
                        onClick={() => onSort?.(column.key)}
                        className={`sort-button p-1 rounded hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                          isSorted ? 'text-primary-600' : 'text-secondary-400'
                        }`}
                        aria-label={`Sort by ${column.title}`}
                        aria-expanded={isSorted}
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            isSorted && sortConfig?.direction === 'desc' ? 'rotate-180' : ''
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
                  </div>

                  {isFilterable && (
                    <div className="mt-1">
                      <input
                        type="text"
                        placeholder={`Filter ${column.title.toLowerCase()}...`}
                        value={filterValue || ''}
                        onChange={(e) => onFilterChange?.(column.key, e.target.value)}
                        className="filter-input text-xs px-2 py-1 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full max-w-[200px]"
                        aria-label={`Filter by ${column.title}`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default TableHeader;