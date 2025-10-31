/**
 * Standardized DataTable Component
 * Enterprise-grade table with TanStack Table + shadcn/ui
 * Supports sorting, filtering, pagination, and accessibility
 */

import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getPaginationRowModel,
  PaginationState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  onRowClick?: (row: TData) => void;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  onPaginationChange?: (pagination: PaginationState) => void;
  sortable?: boolean;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  onRowClick,
  pagination,
  onPaginationChange,
  sortable = true,
  className = '',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortable ? getSortedRowModel() : undefined,
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    state: {
      sorting,
      pagination: pagination
        ? {
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
          }
        : undefined,
    },
    manualPagination: !!pagination,
    pageCount: pagination?.pageCount,
  });

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-md border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50">
                {headerGroup.headers.map((header) => {
                  const canSort = sortable && header.column.getCanSort();
                  
                  return (
                    <TableHead key={header.id} className="font-semibold text-gray-700">
                      {header.isPlaceholder ? null : (
                        <div
                          className={canSort ? 'flex items-center gap-2 cursor-pointer select-none' : ''}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          onKeyDown={
                            canSort
                              ? (e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    header.column.getToggleSortingHandler()?.(e as any);
                                  }
                                }
                              : undefined
                          }
                          role={canSort ? 'button' : undefined}
                          tabIndex={canSort ? 0 : undefined}
                          aria-label={
                            canSort
                              ? `Sort by ${header.column.id} ${
                                  header.column.getIsSorted() === 'asc'
                                    ? 'descending'
                                    : header.column.getIsSorted() === 'desc'
                                    ? 'ascending'
                                    : 'ascending'
                                }`
                              : undefined
                          }
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="ml-2">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-3 text-gray-600">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-2" role="navigation" aria-label="Table pagination">
          <div className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">{pagination.pageIndex * pagination.pageSize + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPaginationChange?.({
                  pageIndex: 0,
                  pageSize: pagination.pageSize,
                })
              }
              disabled={pagination.pageIndex === 0}
              aria-label="Go to first page"
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPaginationChange?.({
                  pageIndex: pagination.pageIndex - 1,
                  pageSize: pagination.pageSize,
                })
              }
              disabled={pagination.pageIndex === 0}
              aria-label="Go to previous page"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700">
              Page {pagination.pageIndex + 1} of {pagination.pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPaginationChange?.({
                  pageIndex: pagination.pageIndex + 1,
                  pageSize: pagination.pageSize,
                })
              }
              disabled={pagination.pageIndex >= pagination.pageCount - 1}
              aria-label="Go to next page"
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPaginationChange?.({
                  pageIndex: pagination.pageCount - 1,
                  pageSize: pagination.pageSize,
                })
              }
              disabled={pagination.pageIndex >= pagination.pageCount - 1}
              aria-label="Go to last page"
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
