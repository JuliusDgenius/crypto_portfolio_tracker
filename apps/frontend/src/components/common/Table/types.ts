import React from "react";

export interface Column<T> {
    key: string;
    title: string;
    render?: (value: any, record: T) => React.ReactNode;
    sortable?: boolean;
    width?: string | number;
    align?: 'left' | 'center' | 'right';
  }
  
  export interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    pagination?: {
      currentPage: number;
      pageSize: number;
      total: number;
      onChange: (page: number, pageSize: number) => void;
    };
    sortable?: boolean;
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
    rowKey?: string | ((record: T) => string);
    emptyText?: string;
    className?: string;
  }
  
  export interface TableHeaderProps<T> {
    columns: Column<T>[];
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (key: string) => void;
  }

  export interface PaginationProps {
    currentPage: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  }

  export interface TableBodyProps<T> {
    data: T[];
    columns: Column<T>[];
    rowKey: keyof T | ((record: T) => string);
    loading?: boolean;
    emptyText?: string;
  }