import React from 'react';
import { Table, TableColumn } from './index';

// Test data interface
interface TestData {
  id: number;
  name: string;
  value: number;
  status: 'active' | 'inactive';
  category: string;
  description?: string;
}

// Sample test data
const testData: TestData[] = [
  {
    id: 1,
    name: 'Test Item 1',
    value: 100,
    status: 'active',
    category: 'Category A',
    description: 'This is a test item with a longer description to test ellipsis behavior'
  },
  {
    id: 2,
    name: 'Test Item 2',
    value: 200,
    status: 'inactive',
    category: 'Category B',
    description: 'Another test item'
  },
  {
    id: 3,
    name: 'Test Item 3',
    value: 300,
    status: 'active',
    category: 'Category A',
  },
  {
    id: 4,
    name: 'Test Item 4',
    value: 400,
    status: 'active',
    category: 'Category C',
    description: 'Test item with medium description length'
  },
  {
    id: 5,
    name: 'Test Item 5',
    value: 500,
    status: 'inactive',
    category: 'Category B',
  },
];

// Test table component
const TableTest: React.FC = () => {
  const [selectedRows, setSelectedRows] = React.useState<string[] | number[]>([]);
  const [loading, setLoading] = React.useState(false);

  const columns: TableColumn<TestData>[] = [
    {
      key: 'id',
      title: 'ID',
      dataIndex: 'id',
      sortable: true,
      width: '80px',
      align: 'center' as const,
    },
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
      sortable: true,
      filterable: true,
      width: '150px',
      align: 'left' as const,
      render: (value) => (
        <span className="font-semibold text-secondary-900">{value}</span>
      ),
    },
    {
      key: 'value',
      title: 'Value',
      dataIndex: 'value',
      sortable: true,
      width: '100px',
      align: 'right' as const,
      render: (value) => (
        <span className="font-mono text-primary-600">${value}</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      sortable: true,
      filterable: true,
      width: '120px',
      align: 'center' as const,
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
        }`}>
          {value === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'category',
      title: 'Category',
      dataIndex: 'category',
      sortable: true,
      filterable: true,
      width: '120px',
      align: 'center' as const,
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      width: '200px',
      align: 'left' as const,
      ellipsis: true,
      render: (value) => (
        <span 
          className="text-secondary-600 max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
          title={value || 'No description'}
        >
          {value || 'No description'}
        </span>
      ),
    },
  ];

  const pagination = {
    current: 1,
    pageSize: 10,
    total: testData.length,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: true,
    pageSizeOptions: ['5', '10', '20', '50'],
  };

  const selection = {
    selectedRowKeys: selectedRows,
    onChange: (keys: string[] | number[], rows: TestData[]) => {
      setSelectedRows(keys);
      console.log('Selected rows:', rows);
    },
  };

  const handleSort = (columnKey: string, direction: 'asc' | 'desc') => {
    console.log('Sort:', columnKey, direction);
  };

  const handleFilter = (value: any, columnKey: string) => {
    console.log('Filter:', columnKey, value);
  };

  const handleRowClick = (record: TestData) => {
    console.log('Row clicked:', record);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-secondary-900">Table Component Test</h2>
          <button
            onClick={() => setLoading(!loading)}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {loading ? 'Stop Loading' : 'Toggle Loading'}
          </button>
        </div>

        <Table<TestData>
          columns={columns}
          data={testData}
          loading={loading}
          pagination={pagination}
          selection={selection}
          rowKey="id"
          className="w-full"
          bordered={true}
          striped={true}
          compact={false}
          emptyText="No test data available"
          sorting={{ onSort: handleSort }}
          filtering={{
            onFilter: handleFilter,
            onFilterChange: handleFilter,
          }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
          })}
        />

        <div className="mt-4 p-4 bg-secondary-50 rounded-md">
          <h3 className="font-medium text-secondary-900 mb-2">Test Results</h3>
          <p className="text-sm text-secondary-600">
            Selected Rows: {selectedRows.length}
          </p>
          <p className="text-sm text-secondary-600">
            Total Data: {testData.length} items
          </p>
          <p className="text-sm text-secondary-600">
            Loading State: {loading ? 'Active' : 'Inactive'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TableTest;