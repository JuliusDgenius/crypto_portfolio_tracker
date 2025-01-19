import { useState, useCallback } from 'react';
import { TableProps } from './types';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { Pagination } from './Pagination';

export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  sortable = false,
  onSort,
  rowKey = 'id',
  emptyText,
  className,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = useCallback(
    (key: string) => {
      if (!sortable || !onSort) return;

      const direction =
        sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
      
      setSortConfig({ key, direction });
      onSort(key, direction);
    },
    [sortConfig, sortable, onSort]
  );

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="overflow-x-auto">
        <div className="align-middle inline-block min-w-full">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <TableHeader
                columns={columns}
                sortKey={sortConfig?.key}
                sortDirection={sortConfig?.direction}
                onSort={sortable ? handleSort : undefined}
              />
              <TableBody
                data={data}
                columns={columns}
                rowKey={rowKey}
                loading={loading}
                emptyText={emptyText}
              />
            </table>
          </div>
        </div>
      </div>
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={pagination.onChange}
        />
      )}
    </div>
  );
}