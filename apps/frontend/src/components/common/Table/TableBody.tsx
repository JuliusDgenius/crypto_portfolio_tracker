import { TableBodyProps } from './types';

export function TableBody<T>({ data, columns, rowKey, loading, emptyText }: TableBodyProps<T>) {
  const getRowKey = (record: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    const value = record[rowKey];
    return String(value);
  };

  if (loading) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className="px-6 py-4 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (!data.length) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
            {emptyText || 'No data available'}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((record: T) => {
        const key = getRowKey(record);
        return (
          <tr key={key} className="hover:bg-gray-50">
            {columns.map((column) => (
              <td
                key={`${key}-${String(column.key)}`}
                className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                  column.align ? `text-${column.align}` : ''
                }`}
              >
                {column.render
                  ? column.render(record[column.key as keyof T], record)
                  : String(record[column.key as keyof T])}
              </td>
            ))}
          </tr>
        );
      })}
    </tbody>
  );
}