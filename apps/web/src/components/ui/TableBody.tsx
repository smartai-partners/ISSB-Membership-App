import React from 'react';
import TableRow from './TableRow';
import TableCell from './TableCell';
import { TableColumn } from './Table';

export interface TableBodyProps<T = any> {
  data: T[];
  loading?: boolean;
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
  getRowKey?: (record: T, index: number) => string | number;
  rowClassName?: (record: T, index: number) => string;
  compact?: boolean;
  emptyText?: React.ReactNode;
  onRow?: (record: T, index: number) => {
    onClick?: (e: React.MouseEvent) => void;
    onDoubleClick?: (e: React.MouseEvent) => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
  };
}

const TableBody = <T extends Record<string, any>>({
  data,
  loading = false,
  columns,
  sortConfig,
  onSort,
  filterValues = {},
  onFilterChange,
  selection,
  selectedRowKeys = [],
  onSelectionChange,
  getRowKey = () => 0,
  rowClassName,
  compact = false,
  emptyText = 'No data available',
  onRow,
}: TableBodyProps<T>) => {
  const handleRowSelect = (record: T, index: number, checked: boolean) => {
    if (!selection?.onChange) return;

    const key = getRowKey(record, index);
    const newSelectedKeys = checked
      ? [...selectedRowKeys, key]
      : selectedRowKeys.filter(k => k !== key);
    
    onSelectionChange?.(newSelectedKeys);
    
    const selectedRows = data.filter((r, idx) => 
      newSelectedKeys.includes(getRowKey(r, idx))
    );
    selection.onChange(newSelectedKeys, selectedRows);
  };

  if (loading) {
    return (
      <tbody className="table-body">
        <tr>
          <td 
            colSpan={columns.length + (selection ? 1 : 0)}
            className={`table-loading-cell ${compact ? 'py-8' : 'py-16'} px-4 text-center`}
            role="cell"
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="text-secondary-600 text-sm">Loading data...</span>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (data.length === 0) {
    return (
      <tbody className="table-body">
        <tr>
          <td 
            colSpan={columns.length + (selection ? 1 : 0)}
            className={`table-empty-cell ${compact ? 'py-12' : 'py-16'} px-4 text-center`}
            role="cell"
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <svg 
                className="w-12 h-12 text-secondary-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              <div className="text-secondary-600">
                {typeof emptyText === 'string' ? (
                  <span className="text-sm">{emptyText}</span>
                ) : (
                  emptyText
                )}
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="table-body">
      {data.map((record, index) => {
        const rowKey = getRowKey(record, index);
        const isSelected = selectedRowKeys.includes(rowKey);
        const isDisabled = selection?.getCheckboxProps?.(record)?.disabled;
        const customRowClass = rowClassName?.(record, index);
        const customRowProps = onRow?.(record, index);

        const rowClasses = [
          'table-row',
          'border-b border-secondary-100',
          'hover:bg-secondary-50',
          isSelected ? 'bg-primary-50' : '',
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          customRowClass || '',
        ].filter(Boolean).join(' ');

        const handleClick = (e: React.MouseEvent) => {
          if (isDisabled) return;
          
          if (selection?.onChange && e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
            return; // Don't handle click if it's a checkbox
          }
          
          // Toggle row selection on click (if selection is enabled)
          if (selection?.onChange) {
            handleRowSelect(record, index, !isSelected);
          }
          
          customRowProps?.onClick?.(e);
        };

        const handleDoubleClick = (e: React.MouseEvent) => {
          if (isDisabled) return;
          customRowProps?.onDoubleClick?.(e);
        };

        const handleContextMenu = (e: React.MouseEvent) => {
          if (isDisabled) return;
          customRowProps?.onContextMenu?.(e);
        };

        const handleMouseEnter = (e: React.MouseEvent) => {
          if (isDisabled) return;
          customRowProps?.onMouseEnter?.(e);
        };

        const handleMouseLeave = (e: React.MouseEvent) => {
          if (isDisabled) return;
          customRowProps?.onMouseLeave?.(e);
        };

        return (
          <TableRow
            key={rowKey}
            record={record}
            index={index}
            columns={columns}
            sortConfig={sortConfig}
            onSort={onSort}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            selection={selection}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={onSelectionChange}
            getRowKey={getRowKey}
            isSelected={isSelected}
            isDisabled={isDisabled}
            compact={compact}
            className={rowClasses}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}
    </tbody>
  );
};

export default TableBody;