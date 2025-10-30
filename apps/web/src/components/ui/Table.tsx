import React, { useState, useMemo, useCallback } from 'react';
import TableHeader from './TableHeader';
import TableBody from './TableBody';
import TableCell from './TableCell';
import TableRow from './TableRow';

// Types
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  sticky?: boolean;
  ellipsis?: boolean;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current?: number;
    pageSize?: number;
    total?: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    showTotal?: boolean;
    pageSizeOptions?: string[];
    onChange?: (page: number, pageSize: number) => void;
    onShowSizeChange?: (current: number, size: number) => void;
  };
  sorting?: {
    columnKey?: string;
    direction?: 'asc' | 'desc';
    onSort?: (columnKey: string, direction: 'asc' | 'desc') => void;
  };
  filtering?: {
    filteredValue?: any[];
    onFilter?: (value: any, record: T) => boolean;
    onFilterChange?: (value: any, columnKey: string) => void;
  };
  selection?: {
    selectedRowKeys?: string[] | number[];
    onChange?: (selectedRowKeys: string[] | number[], selectedRows: T[]) => void;
    getCheckboxProps?: (record: T) => { disabled?: boolean };
  };
  rowKey?: string | ((record: T) => string | number);
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: (record: T, index: number) => string;
  emptyText?: React.ReactNode;
  bordered?: boolean;
  striped?: boolean;
  compact?: boolean;
  scroll?: {
    x?: number | string;
    y?: number | string;
  };
  onRow?: (record: T, index: number) => {
    onClick?: (e: React.MouseEvent) => void;
    onDoubleClick?: (e: React.MouseEvent) => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
  };
}

const Table = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  sorting,
  filtering,
  selection,
  rowKey = 'id',
  className = '',
  headerClassName = '',
  bodyClassName = '',
  rowClassName,
  emptyText = 'No data available',
  bordered = false,
  striped = false,
  compact = false,
  scroll,
  onRow,
}: TableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(pagination?.current || 1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
  const [sortConfig, setSortConfig] = useState<{
    columnKey: string;
    direction: 'asc' | 'desc';
  } | null>(sorting?.columnKey ? {
    columnKey: sorting.columnKey,
    direction: sorting.direction || 'asc'
  } : null);

  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[] | number[]>(
    selection?.selectedRowKeys || []
  );

  // Get row key function
  const getRowKey = useCallback((record: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return (record as any)[rowKey] || index;
  }, [rowKey]);

  // Filter data
  const filteredData = useMemo(() => {
    if (!filtering?.filteredValue || filtering.filteredValue.length === 0) {
      return data;
    }
    
    return data.filter((record) => {
      return Object.entries(filterValues).every(([key, value]) => {
        if (!value) return true;
        return filtering.onFilter ? filtering.onFilter(value, record) : true;
      });
    });
  }, [data, filterValues, filtering]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.columnKey);
      if (!column || !column.sortable) {
        return 0;
      }

      let aValue = column.dataIndex ? a[column.dataIndex] : undefined;
      let bValue = column.dataIndex ? b[column.dataIndex] : undefined;

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) {
      return sortedData;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination]);

  // Handle sorting
  const handleSort = useCallback((columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.columnKey === columnKey) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }

    setSortConfig({ columnKey, direction });
    sorting?.onSort?.(columnKey, direction);
  }, [sortConfig, columns, sorting]);

  // Handle filter change
  const handleFilterChange = useCallback((columnKey: string, value: any) => {
    const newFilterValues = { ...filterValues, [columnKey]: value };
    setFilterValues(newFilterValues);
    filtering?.onFilterChange?.(value, columnKey);
  }, [filterValues, filtering]);

  // Handle pagination
  const handlePageChange = useCallback((page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize) {
      setPageSize(newPageSize);
    }
    pagination?.onChange?.(page, newPageSize || pageSize);
  }, [pageSize, pagination]);

  // Handle selection
  const handleSelectionChange = useCallback((keys: string[] | number[]) => {
    setSelectedRowKeys(keys);
    const selectedRows = data.filter((record, index) => 
      keys.includes(getRowKey(record, index))
    );
    selection?.onChange?.(keys, selectedRows);
  }, [data, getRowKey, selection]);

  const totalItems = pagination?.total || sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const tableClasses = `
    table-container
    ${className}
    ${bordered ? 'bordered' : ''}
    ${striped ? 'striped' : ''}
    ${compact ? 'compact' : ''}
  `;

  return (
    <div className={`table-wrapper ${scroll?.x || scroll?.y ? 'overflow-auto' : ''}`}>
      <table 
        className={tableClasses.trim()}
        style={scroll?.x ? { minWidth: scroll.x } : undefined}
        role="table"
        aria-label="Data table"
      >
        <TableHeader
          columns={columns}
          sortConfig={sortConfig}
          onSort={handleSort}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          selection={selection}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={handleSelectionChange}
          data={data}
          getRowKey={getRowKey}
          className={headerClassName}
          compact={compact}
        />
        
        <TableBody
          data={paginatedData}
          loading={loading}
          columns={columns}
          sortConfig={sortConfig}
          onSort={handleSort}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          selection={selection}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={handleSelectionChange}
          getRowKey={getRowKey}
          rowClassName={rowClassName}
          compact={compact}
          emptyText={emptyText}
          onRow={onRow}
        />
      </table>

      {pagination && (
        <div className="table-pagination mt-4 flex items-center justify-between">
          <div className="pagination-info text-sm text-secondary-600">
            {pagination.showTotal !== false && (
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
              </span>
            )}
          </div>
          
          <div className="pagination-controls flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn px-3 py-2 text-sm border border-secondary-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
              aria-label="Previous page"
            >
              Previous
            </button>
            
            <div className="page-numbers flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = currentPage <= 3 
                  ? i + 1 
                  : currentPage >= totalPages - 2 
                  ? totalPages - 4 + i 
                  : currentPage - 2 + i;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`pagination-btn px-3 py-2 text-sm border rounded-md ${
                      currentPage === pageNum
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'border-secondary-300 hover:bg-secondary-50'
                    }`}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn px-3 py-2 text-sm border border-secondary-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;