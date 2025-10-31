# Redux Toolkit Quick Reference Guide

## For Developers Working on Phase 2+ Migrations

### Quick Setup

All infrastructure is already set up. You just need to use the new patterns in your components.

### Import Paths

```typescript
// Typed hooks
import { useAppSelector, useAppDispatch } from '@/hooks/redux';

// RTK Query hooks
import { 
  useGetVolunteerOpportunitiesQuery,
  useGetMemberProfileQuery,
  useUpdateMemberProfileMutation,
  // ... other hooks
} from '@/store/api/memberApi';

// Actions
import { setSession, signOut } from '@/store/slices/authSlice';
```

## Common Patterns

### 1. Fetching Data (Queries)

**Before (Direct Supabase):**
```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchData() {
    const { data, error } = await supabase
      .from('volunteer_opportunities')
      .select('*');
    setData(data);
    setLoading(false);
  }
  fetchData();
}, []);
```

**After (RTK Query):**
```typescript
const { data, isLoading, error, refetch } = useGetVolunteerOpportunitiesQuery();

// That's it! Automatic caching, deduplication, refetching
```

### 2. Mutating Data (Mutations)

**Before:**
```typescript
async function updateProfile(updates) {
  setLoading(true);
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  setLoading(false);
  
  if (!error) {
    // Manually refetch or update state
  }
}
```

**After:**
```typescript
const [updateProfile, { isLoading, error }] = useUpdateMemberProfileMutation();

async function handleUpdate(updates) {
  try {
    await updateProfile(updates).unwrap();
    // Cache automatically invalidated and refetched
  } catch (err) {
    console.error('Failed to update:', err);
  }
}
```

### 3. Accessing Auth State

**Option A (Current - Context API):**
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, profile, loading } = useAuth();
  // ...
}
```

**Option B (New - Redux):**
```typescript
import { useAppSelector } from '@/hooks/redux';

function MyComponent() {
  const { user, session, loading } = useAppSelector(state => state.auth);
  // ...
}
```

Both work! Use whichever makes sense for your component.

### 4. Design Tokens

```typescript
// In JSX - use Tailwind with CSS variables
<div className="bg-[var(--color-primary-50)] text-[var(--color-primary-900)]">
  Green mosque branding
</div>

// Or create utility classes in your CSS
.button-primary {
  background-color: var(--color-primary-600);
  color: white;
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.button-primary:hover {
  background-color: var(--color-primary-700);
}
```

## RTK Query Features

### Polling
```typescript
const { data } = useGetVolunteerOpportunitiesQuery(undefined, {
  pollingInterval: 30000, // Refetch every 30 seconds
});
```

### Skip Query
```typescript
const { data } = useGetMemberProfileQuery(userId, {
  skip: !userId, // Don't run query until userId exists
});
```

### Refetch on Focus
```typescript
const { data } = useGetEventsQuery(undefined, {
  refetchOnFocus: true, // Refetch when user returns to tab
});
```

### Manual Refetch
```typescript
const { data, refetch } = useGetVolunteerOpportunitiesQuery();

// Later...
<button onClick={() => refetch()}>Refresh</button>
```

## Redux DevTools

### Open DevTools
1. Install Redux DevTools browser extension
2. Open browser DevTools (F12)
3. Click "Redux" tab

### Features
- **Action History** - See all dispatched actions
- **State Inspector** - Browse current state tree
- **Time Travel** - Jump to any previous state
- **Action Replay** - Replay actions step-by-step
- **State Diff** - See what changed in each action

## Design Token Reference

### Colors
```css
/* Primary Green Palette */
--color-primary-50 through --color-primary-950

/* Neutral Grays */
--color-gray-50 through --color-gray-950

/* Semantic */
--color-success / --color-success-bg
--color-warning / --color-warning-bg
--color-error / --color-error-bg
--color-info / --color-info-bg
```

### Spacing
```css
--space-1 (4px)
--space-2 (8px)
--space-3 (12px)
--space-4 (16px)
--space-6 (24px)
--space-8 (32px)
--space-12 (48px)
--space-16 (64px)
```

### Typography
```css
--font-size-xs (12px)
--font-size-sm (14px)
--font-size-base (16px)
--font-size-lg (18px)
--font-size-xl (20px)
--font-size-2xl (24px)
--font-size-3xl (30px)
```

### Border Radius
```css
--radius-sm (2px)
--radius-md (6px)
--radius-lg (8px)
--radius-xl (12px)
--radius-2xl (16px)
```

## Migration Checklist

When migrating a component to RTK Query:

- [ ] Replace useState/useEffect with RTK Query hook
- [ ] Remove manual loading states (use isLoading)
- [ ] Remove manual error handling (use error)
- [ ] Remove manual cache management (automatic)
- [ ] Test with Redux DevTools
- [ ] Verify cache invalidation works
- [ ] Check for console errors

## Common Issues

### Issue: Query not refetching
**Solution:** Check tag invalidation in mutations
```typescript
invalidatesTags: [{ type: 'Volunteer', id: 'LIST' }]
```

### Issue: TypeScript errors on query results
**Solution:** Ensure proper type annotations
```typescript
const { data } = useGetMemberProfileQuery(userId);
// data is Profile | undefined
```

### Issue: Mutation not updating UI
**Solution:** Ensure tags are properly provided/invalidated
```typescript
// In query
providesTags: ['Profile']

// In mutation
invalidatesTags: ['Profile']
```

## Best Practices

1. **Use Typed Hooks** - Always use useAppSelector/useAppDispatch
2. **Avoid Overfetching** - Use skip option when appropriate
3. **Tag Everything** - Proper tags enable automatic cache updates
4. **Handle Loading States** - Always check isLoading before rendering
5. **Error Boundaries** - Wrap components in error boundaries
6. **Design Tokens** - Use CSS variables for consistency

## Getting Help

1. Check Redux Toolkit docs: https://redux-toolkit.js.org/
2. Check RTK Query docs: https://redux-toolkit.js.org/rtk-query/overview
3. Review Phase 1 implementation: `/workspace/docs/frontend_enhancements/phase1_implementation_complete.md`
4. Check example usage in API slice: `/workspace/issb-portal/src/store/api/memberApi.ts`

## Example: Complete Component Migration

**Before:**
```typescript
function OpportunityList() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('volunteer_opportunities')
          .select('*')
          .eq('status', 'ACTIVE');
        
        if (error) throw error;
        setOpportunities(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {opportunities.map(opp => (
        <div key={opp.id}>{opp.title}</div>
      ))}
    </div>
  );
}
```

**After:**
```typescript
import { useGetVolunteerOpportunitiesQuery } from '@/store/api/memberApi';

function OpportunityList() {
  const { data: opportunities, isLoading, error } = useGetVolunteerOpportunitiesQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.data}</div>;

  return (
    <div>
      {opportunities?.map(opp => (
        <div key={opp.id}>{opp.title}</div>
      ))}
    </div>
  );
}
```

**Benefits:**
- 70% less code
- Automatic caching
- Automatic deduplication
- Background refetching
- Better TypeScript support
- Redux DevTools integration
