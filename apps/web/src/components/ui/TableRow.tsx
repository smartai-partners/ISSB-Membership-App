import React from 'react';
import TableCell from './TableCell';
import { TableColumn } from './Table';

export interface TableRowProps<T = any> {
  record: T;
  index: number;
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
  isSelected?: boolean;
  isDisabled?: boolean;
  compact?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

const TableRow = <T extends Record<string, any>>({
  record,
  index,
  columns,
  sortConfig,
  onSort,
  filterValues = {},
  onFilterChange,
  selection,
  selectedRowKeys = [],
  onSelectionChange,
  getRowKey = () => 0,
  isSelected = false,
  isDisabled = false,
  compact = false,
  className = '',
  onClick,
  onDoubleClick,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
}: TableRowProps<T>) => {
  const rowKey = getRowKey(record, index);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (!selection?.onChange) return;

    const checked = e.target.checked;
    const newSelectedKeys = checked
      ? [...selectedRowKeys, rowKey]
      : selectedRowKeys.filter(k => k !== rowKey);
    
    onSelectionChange?.(newSelectedKeys);
    
    const selectedRows = [record]; // This would be calculated by the parent
    selection.onChange(newSelectedKeys, selectedRows);
  };

  const handleCellClick = (e: React.MouseEvent, columnKey: string) => {
    // Stop propagation if it's not a sortable column to prevent row selection
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) {
      e.stopPropagation();
    }
  };

  return (
    <tr
      className={className}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="row"
      aria-selected={isSelected}
      aria-disabled={isDisabled}
    >
      {selection && (
        <td className={`table-cell selection-cell ${compact ? 'py-2' : 'py-3'} px-4`} role="cell">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              disabled={isDisabled}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Select row"
            />
          </div>
        </td>
      )}
      
      {columns.map((column) => {
        const value = column.dataIndex ? record[column.dataIndex] : undefined;
        const isSortable = column.sortable;
        const isSorted = sortConfig?.columnKey === column.key;
        
        const cellClasses = [
          'table-cell',
          `text-${column.align || 'left'}`,
          column.ellipsis ? 'max-w-0 overflow-hidden text-ellipsis whitespace-nowrap' : '',
          column.className || '',
          compact ? 'py-2' : 'py-3',
          'px-4',
          'border-b border-secondary-100',
          'text-sm',
        ].filter(Boolean).join(' ');

        return (
          <TableCell
            key={column.key}
            record={record}
            index={index}
            column={column}
            value={value}
            isSortable={isSortable}
            isSorted={isSorted}
            sortDirection={sortConfig?.direction}
            compact={compact}
            className={cellClasses}
            onClick={(e) => handleCellClick(e, column.key)}
            onSort={onSort ? () => onSort(column.key) : undefined}
            filterValue={filterValues[column.key]}
            onFilterChange={onFilterChange ? (value) => onFilterChange(column.key, value) : undefined}
          />
        );
      })}
    </tr>
  );
};

export default TableRow;