# Phase 2 Admin Dashboard - Developer Quick Reference

## For Developers Working on Admin Features

### Quick Setup

All Phase 2 infrastructure is ready to use. Import and use the new patterns in your admin components.

## Import Paths

```typescript
// Admin API hooks
import {
  useGetAllUsersQuery,
  useUpdateUserProfileMutation,
  useDeleteUserMutation,
  useBulkUpdateUsersMutation,
  useGetUserActivityQuery,
  useGetAdminStatsQuery,
} from '@/store/api/adminApi';

// Reusable admin components
import { DataTable } from '@/components/admin/DataTable';
import { UserFilters } from '@/components/admin/UserFilters';

// UI components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
```

## Common Patterns

### 1. Using DataTable Component

```typescript
import { DataTable } from '@/components/admin/DataTable';
import { ColumnDef } from '@tanstack/react-table';

// Define columns
const columns: ColumnDef<YourType>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span>{row.original.name}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge>{row.original.status}</Badge>,
  },
];

// Use in component
<DataTable
  columns={columns}
  data={data?.items || []}
  loading={isLoading}
  pagination={{
    pageIndex: page,
    pageSize: 25,
    pageCount: data?.pageCount || 0,
    total: data?.total || 0,
  }}
  onPaginationChange={(p) => setPage(p.pageIndex)}
  sortable
/>
```

### 2. Using Admin RTK Query Hooks

**Fetching Users**:
```typescript
const { data, isLoading, error, refetch } = useGetAllUsersQuery({
  searchQuery: 'john',
  roles: ['member', 'student'],
  statuses: ['active'],
  membershipTier: 'standard',
  pageIndex: 0,
  pageSize: 25,
  sortBy: 'created_at',
  sortOrder: 'desc',
});

// data structure:
// {
//   users: Profile[],
//   total: number,
//   pageIndex: number,
//   pageSize: number,
//   pageCount: number
// }
```

**Updating User**:
```typescript
const [updateUser, { isLoading }] = useUpdateUserProfileMutation();

async function handleUpdate(userId: string, updates: Partial<Profile>) {
  try {
    await updateUser({ userId, updates }).unwrap();
    toast({ title: 'Success', description: 'User updated' });
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  }
}
```

**Deleting User**:
```typescript
const [deleteUser, { isLoading }] = useDeleteUserMutation();

async function handleDelete(userId: string) {
  if (!confirm('Are you sure?')) return;
  
  try {
    await deleteUser(userId).unwrap();
    toast({ title: 'Success', description: 'User deleted' });
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  }
}
```

**Bulk Operations**:
```typescript
const [bulkUpdate] = useBulkUpdateUsersMutation();

async function handleBulkUpdate(operations: BulkUpdateOperation[]) {
  const result = await bulkUpdate(operations).unwrap();
  
  console.log(`Success: ${result.success}, Failed: ${result.failed}`);
  
  if (result.errors) {
    result.errors.forEach(e => {
      console.error(`User ${e.userId}: ${e.error}`);
    });
  }
}
```

### 3. Using UserFilters Component

```typescript
import { UserFilters } from '@/components/admin/UserFilters';

const [filters, setFilters] = useState({
  searchQuery: '',
  roles: [],
  statuses: [],
  membershipTier: '',
});

<UserFilters
  onFilterChange={(newFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page on filter change
  }}
/>
```

### 4. Creating Accessible Dialogs

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

<Dialog open={showDialog} onOpenChange={setShowDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit User</DialogTitle>
      <DialogDescription>
        Update user information and permissions
      </DialogDescription>
    </DialogHeader>
    
    {/* Form fields here */}
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowDialog(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>
        Save Changes
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 5. Using Dropdown Menus

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => handleEdit(user)}>
      Edit User
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleDelete(user)} className="text-red-600">
      Delete User
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Admin Edge Functions

### Calling Edge Functions

```typescript
// Example: Update user role via Edge Function
const response = await supabase.functions.invoke('admin-update-user-role', {
  body: {
    userId: 'user-id-here',
    role: 'admin',
  },
});

if (response.error) {
  console.error('Error:', response.error);
} else {
  console.log('Success:', response.data);
}
```

### Creating New Edge Functions

**Pattern**:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // 1. Verify admin permissions
    const authHeader = req.headers.get('Authorization');
    // ... verify admin role ...

    // 2. Parse request body
    const { field1, field2 } = await req.json();

    // 3. Perform admin operation
    // ... use service role key for privileged ops ...

    // 4. Log to audit trail
    await logAuditTrail({ action: 'action_name', userId, ... });

    // 5. Return success
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Accessibility Guidelines

### Required Practices

**1. Keyboard Navigation**:
```typescript
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleAction();
  }
}}
role="button"
tabIndex={0}
```

**2. ARIA Labels**:
```typescript
<button aria-label="Delete user John Doe">
  <Trash2 className="h-4 w-4" />
</button>
```

**3. Form Labels**:
```typescript
<Label htmlFor="user-email">Email Address</Label>
<Input
  id="user-email"
  type="email"
  aria-describedby="email-help"
/>
<p id="email-help" className="text-sm text-gray-500">
  We'll never share your email
</p>
```

**4. Live Regions**:
```typescript
<div aria-live="polite" className="sr-only">
  {announcement}
</div>
```

**5. Focus Management**:
```typescript
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (dialogOpen) {
    inputRef.current?.focus();
  }
}, [dialogOpen]);

<Input ref={inputRef} />
```

## UI Component Variants

### Badge
```typescript
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

### Button
```typescript
<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

## Performance Tips

### 1. Memoize Column Definitions
```typescript
const columns = useMemo<ColumnDef<Profile>[]>(
  () => [
    { accessorKey: 'name', header: 'Name' },
    // ... more columns
  ],
  [] // Empty deps - columns don't change
);
```

### 2. Debounce Search Inputs
```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    onSearchChange(searchQuery);
  }, 300); // 300ms debounce

  return () => clearTimeout(timeoutId);
}, [searchQuery]);
```

### 3. Use RTK Query Cache Tags
```typescript
// In API slice
providesTags: (result) =>
  result
    ? [
        ...result.users.map(user => ({ type: 'AdminUsers', id: user.id })),
        { type: 'AdminUsers', id: 'LIST' },
      ]
    : [{ type: 'AdminUsers', id: 'LIST' }],

invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }],
```

## Common Issues & Solutions

### Issue: Table not updating after mutation
**Solution**: Ensure proper cache tag invalidation
```typescript
invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }]
```

### Issue: Filters not applying
**Solution**: Check debouncing and ensure pageIndex resets
```typescript
const handleFilterChange = (newFilters) => {
  setFilters(newFilters);
  setPageIndex(0); // Important!
};
```

### Issue: Accessibility warnings
**Solution**: Add proper ARIA labels
```typescript
<button aria-label="Descriptive action">
  <Icon />
</button>
```

### Issue: TypeScript errors on table columns
**Solution**: Properly type column definitions
```typescript
const columns = useMemo<ColumnDef<YourType>[]>(() => [...], []);
```

## Testing Checklist

When adding new admin features:

- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen reader announces changes
- [ ] Proper ARIA labels on all interactive elements
- [ ] Focus indicators visible
- [ ] Error states handled gracefully
- [ ] Loading states shown
- [ ] Success feedback provided (toast/message)
- [ ] Cache invalidation works correctly
- [ ] Pagination resets on filter change
- [ ] TypeScript types are correct

## Best Practices

1. **Always use RTK Query hooks** for data fetching
2. **Invalidate cache tags** after mutations
3. **Reset pagination** when filters change
4. **Debounce search inputs** (300ms recommended)
5. **Memoize column definitions** for tables
6. **Add ARIA labels** to all interactive elements
7. **Use design tokens** from Phase 1 for styling
8. **Handle loading/error states** in all queries
9. **Provide user feedback** for all actions
10. **Test accessibility** with keyboard and screen reader

## Getting Help

1. Check Phase 2 docs: `/workspace/PHASE2_ADMIN_ENHANCEMENT_SUMMARY.md`
2. Review example: `/workspace/issb-portal/src/pages/EnhancedUsersManagementPage.tsx`
3. Check admin API: `/workspace/issb-portal/src/store/api/adminApi.ts`
4. Inspect DataTable: `/workspace/issb-portal/src/components/admin/DataTable.tsx`
5. Use Redux DevTools to debug state

## Example: Complete Admin Page

See `/workspace/issb-portal/src/pages/EnhancedUsersManagementPage.tsx` for a complete example implementing:
- RTK Query data fetching
- DataTable with sorting and pagination
- User filters with accessibility
- Edit/delete dialogs
- Toast notifications
- Error handling
- Loading states
- Proper TypeScript types
