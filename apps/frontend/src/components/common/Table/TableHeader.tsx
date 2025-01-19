import { TableHeaderProps } from './types';
import { ChevronUp, ChevronDown } from 'lucide-react';

export function TableHeader<T>({ columns, sortKey, sortDirection, onSort }: TableHeaderProps<T>) {
  const handleSort = (key: string) => {
    if (onSort && columns.find(col => col.key === key)?.sortable) {
      onSort(key);
    }
  };

  return (
    <thead className="bg-gray-50">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            className={`
              px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
              ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
              ${column.align ? `text-${column.align}` : ''}
            `}
            style={{ width: column.width }}
            onClick={() => handleSort(column.key)}
          >
            <div className="flex items-center gap-2">
              {column.title}
              {column.sortable && sortKey === column.key && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}