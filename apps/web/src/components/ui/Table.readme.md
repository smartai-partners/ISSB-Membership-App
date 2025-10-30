# Table Component System

A comprehensive, accessible, and feature-rich Table component system built with React, TypeScript, and Tailwind CSS. The table supports sorting, pagination, filtering, selection, and responsive design.

## Features

- **Sorting**: Click column headers to sort data in ascending/descending order
- **Pagination**: Built-in pagination with customizable page sizes
- **Filtering**: Filter data by column values with real-time search
- **Selection**: Select individual rows or use "Select All" functionality
- **Loading States**: Built-in loading spinner and empty state handling
- **Responsive Design**: Mobile-friendly responsive table layout
- **Accessibility**: ARIA attributes, keyboard navigation, and screen reader support
- **Custom Cell Rendering**: Support for custom cell content and formatting
- **Sticky Headers**: Optional sticky column headers for better UX
- **Row Actions**: Support for click handlers and custom row interactions
- **TypeScript**: Full TypeScript support with proper type definitions

## Installation

The table component is part of the UI component library. Import it from:

```typescript
import { Table, TableProps, TableColumn } from '@/components/ui';
```

## Basic Usage

```typescript
import React from 'react';
import { Table } from '@/components/ui/Table';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: boolean;
}

const columns: TableColumn<User>[] = [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    sortable: true,
    filterable: true,
  },
  {
    key: 'email',
    title: 'Email',
    dataIndex: 'email',
    sortable: true,
    render: (value) => (
      <a href={`mailto:${value}`} className="text-primary-600 hover:underline">
        {value}
      </a>
    ),
  },
  {
    key: 'role',
    title: 'Role',
    dataIndex: 'role',
    sortable: true,
    render: (value) => (
      <span className="px-2 py-1 rounded-full text-xs bg-secondary-100">
        {value}
      </span>
    ),
  },
  {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
    render: (value) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {value ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

const data: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: true },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: false },
  // ... more data
];

const UserTable = () => {
  return (
    <Table<User>
      columns={columns}
      data={data}
      rowKey="id"
      pagination={{
        current: 1,
        pageSize: 10,
        total: data.length,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
    />
  );
};

export default UserTable;
```

## Advanced Usage

### With Selection

```typescript
const [selectedRows, setSelectedRows] = useState<string[]>([]);

<Table<User>
  columns={columns}
  data={data}
  selection={{
    selectedRowKeys: selectedRows,
    onChange: (keys, rows) => {
      setSelectedRows(keys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.status === 'inactive',
    }),
  }}
/>
```

### With Custom Sorting and Filtering

```typescript
const [sortConfig, setSortConfig] = useState<{
  columnKey: string;
  direction: 'asc' | 'desc';
} | null>(null);

const handleSort = (columnKey: string, direction: 'asc' | 'desc') => {
  setSortConfig({ columnKey, direction });
  // Implement your sorting logic
  const sortedData = [...data].sort((a, b) => {
    // Sorting logic here
    return 0;
  });
};

<Table<User>
  columns={columns}
  data={data}
  sorting={sortConfig}
  filtering={{
    onFilter: (value, record) => {
      return record.name.toLowerCase().includes(value.toLowerCase());
    },
    onFilterChange: (value, columnKey) => {
      // Handle filter change
    },
  }}
/>
```

### With Row Actions

```typescript
<Table<User>
  columns={columns}
  data={data}
  onRow={(record, index) => ({
    onClick: () => console.log('Row clicked:', record),
    onDoubleClick: () => console.log('Row double-clicked:', record),
    onMouseEnter: () => console.log('Mouse entered row:', index),
  })}
/>
```

## Component API

### TableProps

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `TableColumn<T>[]` | **Required** | Column configuration |
| `data` | `T[]` | **Required** | Table data |
| `loading` | `boolean` | `false` | Loading state |
| `pagination` | `PaginationConfig` | - | Pagination configuration |
| `sorting` | `SortingConfig` | - | Sorting configuration |
| `filtering` | `FilteringConfig` | - | Filtering configuration |
| `selection` | `SelectionConfig` | - | Row selection configuration |
| `rowKey` | `string \| (record: T) => string \| number` | `'id'` | Row key function |
| `className` | `string` | - | Additional CSS classes |
| `bordered` | `boolean` | `false` | Show table borders |
| `striped` | `boolean` | `false` | Alternate row colors |
| `compact` | `boolean` | `false` | Compact table spacing |
| `emptyText` | `ReactNode` | `'No data available'` | Empty state text |
| `onRow` | `(record: T, index: number) => RowProps` | - | Row event handlers |

### TableColumn

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `key` | `string` | **Required** | Unique column key |
| `title` | `string` | **Required** | Column header title |
| `dataIndex` | `keyof T` | - | Data field to display |
| `render` | `(value, record, index) => ReactNode` | - | Custom cell renderer |
| `sortable` | `boolean` | `false` | Enable sorting |
| `filterable` | `boolean` | `false` | Enable filtering |
| `width` | `string` | - | Column width |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Text alignment |
| `className` | `string` | - | Additional CSS classes |
| `ellipsis` | `boolean` | `false` | Truncate text with ellipsis |

### PaginationConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `current` | `number` | `1` | Current page |
| `pageSize` | `number` | `10` | Page size |
| `total` | `number` | **Required** | Total items |
| `showSizeChanger` | `boolean` | `false` | Show page size options |
| `showQuickJumper` | `boolean` | `false` | Show page number input |
| `showTotal` | `boolean` | `true` | Show total count |
| `pageSizeOptions` | `string[]` | `['10', '20', '50', '100']` | Page size options |
| `onChange` | `(page: number, pageSize: number) => void` | - | Page change handler |
| `onShowSizeChange` | `(current: number, size: number) => void` | - | Page size change handler |

## Styling

The table component comes with comprehensive default styles using Tailwind CSS. You can customize the appearance by:

1. **CSS Classes**: Add custom classes via `className` prop
2. **Tailwind Classes**: Use Tailwind utility classes
3. **CSS Variables**: Override CSS custom properties
4. **Custom Styles**: Import and extend the included CSS file

### CSS Classes

```css
/* Main table classes */
.table-wrapper         /* Table container wrapper */
.table-container       /* Main table element */
.table-header         /* Table header */
.table-body           /* Table body */
.table-row            /* Table row */
.table-cell           /* Table cell */
.table-pagination     /* Pagination container */
```

### Responsive Design

The table automatically adapts to different screen sizes:

- **Desktop (768px+)**: Full-featured table with all controls
- **Mobile (< 768px)**: Horizontal scroll with touch-friendly controls

### Accessibility

The table includes comprehensive accessibility features:

- **ARIA Attributes**: Proper role and labeling
- **Keyboard Navigation**: Tab through interactive elements
- **Screen Reader Support**: Semantic HTML and accessible labels
- **High Contrast Support**: Automatic adaptation for high contrast mode
- **Reduced Motion**: Respects user's motion preferences

## Performance Considerations

- **Memoization**: Uses React.useMemo for filtered/sorted/paginated data
- **Efficient Updates**: Minimal re-renders with proper state management
- **Virtual Scrolling**: Consider implementing for large datasets (>1000 rows)
- **Lazy Loading**: Implement pagination for better performance with large datasets

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Examples

See `Table.example.tsx` for a complete implementation example with all features.

## TypeScript Support

Full TypeScript support with proper type definitions for:

- Generic table data types
- Column configurations
- Event handlers
- Component props
- Custom render functions