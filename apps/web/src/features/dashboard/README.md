# Dashboard Components

A comprehensive set of React components for building role-based dashboards with responsive design and data fetching patterns.

## Components

### Dashboard
Main dashboard component that orchestrates all sub-components and manages data fetching.

**Features:**
- Role-based content rendering
- Auto-refresh functionality
- Error handling and loading states
- Responsive layout

**Usage:**
```tsx
import { Dashboard } from '@/features/dashboard';

function App() {
  return <Dashboard />;
}
```

### DashboardStats
Displays overview statistics cards with visual indicators.

**Features:**
- Animated loading states
- Growth indicators
- Responsive grid layout
- Color-coded categories

**Props:**
```tsx
interface DashboardStatsProps {
  stats: DashboardStats;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}
```

### RecentActivity
Shows a feed of recent activities with timestamps and icons.

**Features:**
- Activity type filtering
- Time-ago formatting
- Hover effects
- Scrollable activity list

**Props:**
```tsx
interface RecentActivityProps {
  activities: Activity[];
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}
```

### QuickActions
Displays role-based action buttons with visual indicators.

**Features:**
- Role-based access control
- Tier-based permissions
- Hover animations
- Color-coded actions

**Props:**
```tsx
interface QuickActionsProps {
  actions: QuickAction[];
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}
```

### NotificationCenter
Manages and displays notifications with read/unread states.

**Features:**
- Read/unread filtering
- Mark as read functionality
- Notification categorization
- Time formatting

**Props:**
```tsx
interface NotificationCenterProps {
  notifications: Notification[];
  isLoading?: boolean;
  error?: string | null;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}
```

## Types

### DashboardStats
```tsx
interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalApplications: number;
  totalVolunteerOps: number;
  recentGrowth: {
    users: number;
    events: number;
    applications: number;
    volunteerOps: number;
  };
}
```

### Activity
```tsx
interface Activity {
  id: string;
  type: 'user_registered' | 'event_created' | 'application_submitted' | 'volunteer_signed_up' | 'user_promoted';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
}
```

### Notification
```tsx
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}
```

### QuickAction
```tsx
interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  url: string;
  roles: string[];
  tier?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}
```

## Role-Based Access Control

The components integrate with the permission store to show/hide content based on user roles:

- **ADMIN**: Full access to all features and administrative functions
- **BOARD**: Access to board-specific features and management tools
- **MEMBER**: Limited access to personal features and public content

### Permission Checks

```tsx
import { usePermissionStore } from '@/store/permissionStore';

const { canViewBoardContent, canViewAdminContent } = usePermissionStore();

// Check if user can access board content
if (canViewBoardContent(user)) {
  // Show board-specific features
}

// Check if user can access admin content
if (canViewAdminContent(user)) {
  // Show admin-specific features
}
```

## Data Fetching

The dashboard uses a custom hook `useDashboardData` that:

1. Fetches all dashboard data concurrently
2. Handles loading and error states
3. Provides a refetch function for manual refresh
4. Implements fallback data for graceful degradation

### API Endpoints Expected

The components expect the following API endpoints:

```
GET /dashboard/stats          # Dashboard statistics
GET /dashboard/activity       # Recent activities
GET /dashboard/notifications  # User notifications
GET /dashboard/quick-actions  # Available actions
PATCH /notifications/:id/read # Mark notification as read
PATCH /notifications/mark-all-read # Mark all notifications as read
```

## Styling

Components use Tailwind CSS with:

- Responsive design patterns
- Consistent spacing and typography
- Color-coded status indicators
- Smooth transitions and animations

## Error Handling

All components implement:

1. Loading states with skeleton animations
2. Error states with user-friendly messages
3. Graceful degradation when data is unavailable
4. Retry mechanisms for failed requests

## Performance

- Lazy loading of components
- Memoized calculations where appropriate
- Efficient re-rendering with proper key props
- Optimized API calls with concurrent requests

## Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly content

## Responsive Breakpoints

- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up
- `xl`: 1280px and up

## Future Enhancements

- [ ] Real-time updates with WebSocket
- [ ] Customizable dashboard layouts
- [ ] Dark mode support
- [ ] Advanced filtering and search
- [ ] Export functionality
- [ ] Dashboard analytics
- [ ] Widget configuration
