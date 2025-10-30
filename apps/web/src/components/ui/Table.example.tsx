import React, { useState } from 'react';
import { Table, TableProps } from '../ui/Table';

// Sample data interface
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: boolean;
  age: number;
  createdAt: Date;
}

// Sample data
const sampleData: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    status: true,
    age: 30,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'User',
    status: false,
    age: 25,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    role: 'Moderator',
    status: true,
    age: 35,
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice.brown@example.com',
    role: 'User',
    status: true,
    age: 28,
    createdAt: new Date('2024-04-05'),
  },
  {
    id: 5,
    name: 'Charlie Wilson',
    email: 'charlie.wilson@example.com',
    role: 'Admin',
    status: false,
    age: 42,
    createdAt: new Date('2024-05-12'),
  },
];

// Table example component
const TableExample: React.FC = () => {
  const [data, setData] = useState<User[]>(sampleData);
  const [selectedRows, setSelectedRows] = useState<string[] | number[]>([]);
  const [loading, setLoading] = useState(false);

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name' as keyof User,
      sortable: true,
      filterable: true,
      width: '150px',
      align: 'left' as const,
      render: (value: string) => (
        <span className="font-medium text-secondary-900">{value}</span>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email' as keyof User,
      sortable: true,
      filterable: true,
      width: '200px',
      align: 'left' as const,
      render: (value: string) => (
        <a 
          href={`mailto:${value}`} 
          className="text-primary-600 hover:text-primary-800 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      dataIndex: 'role' as keyof User,
      sortable: true,
      filterable: true,
      width: '120px',
      align: 'center' as const,
      render: (value: string) => {
        const roleColors = {
          Admin: 'bg-red-100 text-red-800',
          Moderator: 'bg-yellow-100 text-yellow-800',
          User: 'bg-green-100 text-green-800',
        };
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleColors[value as keyof typeof roleColors] || 'bg-secondary-100 text-secondary-800'}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status' as keyof User,
      sortable: true,
      filterable: true,
      width: '100px',
      align: 'center' as const,
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'age',
      title: 'Age',
      dataIndex: 'age' as keyof User,
      sortable: true,
      width: '80px',
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono font-medium">{value}</span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      dataIndex: 'createdAt' as keyof User,
      sortable: true,
      width: '120px',
      align: 'center' as const,
      render: (value: Date) => (
        <span className="text-secondary-600">
          {value.toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '120px',
      align: 'center' as const,
      render: (_, record: User) => (
        <div className="flex justify-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              alert(`Edit ${record.name}`);
            }}
            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              alert(`Delete ${record.name}`);
            }}
            className="text-danger-600 hover:text-danger-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // Pagination configuration
  const pagination = {
    current: 1,
    pageSize: 10,
    total: data.length,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    onChange: (page: number, pageSize: number) => {
      console.log('Page changed:', page, pageSize);
    },
    onShowSizeChange: (current: number, size: number) => {
      console.log('Page size changed:', current, size);
    },
  };

  // Selection configuration
  const selection = {
    selectedRowKeys: selectedRows,
    onChange: (selectedRowKeys: string[] | number[], selectedRows: User[]) => {
      setSelectedRows(selectedRowKeys);
      console.log('Selection changed:', selectedRowKeys, selectedRows);
    },
    getCheckboxProps: (record: User) => ({
      disabled: record.name === 'Charlie Wilson', // Disable for demonstration
    }),
  };

  // Sorting configuration
  const [sortConfig, setSortConfig] = useState<{
    columnKey: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (columnKey: string, direction: 'asc' | 'desc') => {
    setSortConfig({ columnKey, direction });
    console.log('Sort changed:', columnKey, direction);
    
    // Implement your sorting logic here
    const sortedData = [...data].sort((a, b) => {
      // This is a simplified example - implement actual sorting logic
      return 0;
    });
    setData(sortedData);
  };

  // Filtering configuration
  const handleFilter = (value: any, columnKey: string) => {
    console.log('Filter changed:', columnKey, value);
    // Implement your filtering logic here
  };

  // Row click handler
  const handleRowClick = (record: User) => {
    console.log('Row clicked:', record);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">Table Component Example</h2>
        <p className="text-secondary-600 mb-6">
          This example demonstrates the table component with sorting, pagination, filtering, 
          selection, and responsive design features.
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setLoading(!loading)}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {loading ? 'Stop Loading' : 'Start Loading'}
          </button>
          <button
            onClick={() => setSelectedRows([])}
            className="px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
          >
            Clear Selection
          </button>
        </div>
        <div className="text-sm text-secondary-600">
          Selected: {selectedRows.length} items
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden">
        <Table<User>
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          sorting={sortConfig}
          filtering={{
            onFilter: handleFilter,
            onFilterChange: handleFilter,
          }}
          selection={selection}
          rowKey="id"
          className="w-full"
          bordered={true}
          striped={true}
          compact={false}
          emptyText="No users found"
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
          })}
        />
      </div>

      {/* Usage Examples */}
      <div className="bg-secondary-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Usage Examples</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-secondary-800 mb-2">Basic Usage:</h4>
            <pre className="bg-secondary-900 text-secondary-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { Table } from '@/components/ui/Table';

const MyTable = () => {
  const columns = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
      sortable: true,
      filterable: true,
    },
    // ... more columns
  ];

  return (
    <Table 
      columns={columns} 
      data={myData} 
      pagination={{ current: 1, pageSize: 10, total: 100 }}
    />
  );
};`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium text-secondary-800 mb-2">With Custom Cell Rendering:</h4>
            <pre className="bg-secondary-900 text-secondary-100 p-4 rounded-lg text-sm overflow-x-auto">
{`const columns = [
  {
    key: 'status',
    title: 'Status',
    render: (value) => (
      <span className={\`px-2 py-1 rounded-full text-xs \${
        value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }\`}>
        {value ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableExample;