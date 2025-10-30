# Layout Components

This directory contains the layout components for the ISSB Portal application. These components provide the structural foundation for the application's UI with authentication-aware navigation, responsive design, and theme support.

## Components

### Base Layout Components

#### `Layout.tsx`
The main layout wrapper component that orchestrates the header, sidebar, main content, and footer.

**Features:**
- Integrates all layout components
- Handles responsive sidebar toggle
- Authentication-aware rendering
- Automatically redirects unauthenticated users

**Usage:**
```tsx
import Layout from '@/components/layout/Layout';

<Layout>
  <YourPageContent />
</Layout>
```

#### `Header.tsx`
Top navigation header with user menu, theme toggle, and notifications.

**Features:**
- User profile dropdown with role/tier badge
- Theme toggle (light/dark/system)
- Notification center
- Mobile-responsive hamburger menu
- Authentication-aware content

**Key Elements:**
- Logo/Brand
- Theme toggle button
- Notification bell with badge
- User menu with profile links
- Sign out functionality

#### `Sidebar.tsx`
Collapsible side navigation with role-based menu items.

**Features:**
- Role and tier-based navigation filtering
- Mobile and desktop versions
- Smooth animations
- Active route highlighting
- User info at bottom

**Navigation Items:**
- Dashboard (all users)
- Profile (all users)
- Membership (all users)
- Volunteer (board/admin only)
- Board Dashboard (board/admin only)
- Member Management (board/admin only)
- Applications (board/admin only)
- Admin Dashboard (admin only)
- User Management (admin only)
- System Settings (admin only)
- Reports (board/admin only)

#### `Footer.tsx`
Site footer with links and organization information.

**Features:**
- Organization info
- Quick links
- Resources
- Social media links
- Newsletter signup
- Version information

### Specialized Layouts

#### `AuthLayout.tsx`
Authentication-focused layout for login, register, and password reset pages.

**Features:**
- Centered authentication form
- Logo and branding
- Automatic redirect for authenticated users
- Responsive design

**Usage:**
```tsx
import AuthLayout from '@/layouts/AuthLayout';

<AuthLayout>
  <LoginForm />
</AuthLayout>
```

#### `MemberLayout.tsx`
Layout for regular members, board members, and admins.

**Features:**
- Full application layout
- Member-level navigation
- Board/admin access granted

#### `BoardLayout.tsx`
Layout for board members and admins with enhanced navigation.

**Features:**
- Board-level navigation access
- Permission-based rendering
- Enhanced sidebar with board-specific items

#### `AdminLayout.tsx`
Layout for administrators with full system access.

**Features:**
- Admin-level navigation access
- System management features
- Highest level of access control

## Theme Support

The layout components support light/dark/system themes using the `useThemeStore`:

### Theme Store (`themeStore.ts`)

**Features:**
- Local storage persistence
- System theme detection
- Automatic theme application
- Meta theme-color updates
- System theme change listeners

**Usage:**
```tsx
import { useThemeStore } from '@/store/themeStore';

const { theme, setTheme, isDarkMode } = useThemeStore();
```

## Authentication Integration

All layout components integrate with the authentication system:

### Auth Store (`authStore.ts`)
- User state management
- Token management
- Login/logout functionality
- Auto-initialization

### Permission System (`permissionStore.ts`)
- Role-based access control
- Tier-based permissions
- Permission checking utilities
- Action-based authorization

## Responsive Design

The layout components are fully responsive with:

- **Mobile-first approach**
- **Collapsible sidebar** for mobile devices
- **Hamburger menu** for navigation
- **Touch-friendly** interactive elements
- **Responsive grid** layouts
- **Mobile-optimized** dropdown menus

## TypeScript Support

All components are fully typed with TypeScript:

```tsx
interface LayoutProps {
  children: React.ReactNode;
}

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: string[];
  allowedTiers?: string[];
  badge?: string;
}
```

## Styling

The components use TailwindCSS with custom configuration:

### Color Scheme
- Primary: Blue-based theme
- Secondary: Gray-based neutral
- Success: Green
- Warning: Yellow
- Danger: Red
- Tier colors: Special colors for different membership tiers

### Classes Used
- `bg-white dark:bg-gray-900` - Background colors
- `text-gray-900 dark:text-white` - Text colors
- `border-gray-200 dark:border-gray-800` - Border colors
- `hover:bg-gray-100 dark:hover:bg-gray-800` - Hover states
- `focus:ring-primary-500` - Focus rings

## Installation

The layout components are automatically available through the application's import system. No additional installation is required.

## Example Usage

### Basic Authenticated Layout
```tsx
import { MemberLayout } from '@/layouts';

<MemberLayout>
  <DashboardPage />
</MemberLayout>
```

### Custom Layout with Theme Toggle
```tsx
import { useThemeStore } from '@/store/themeStore';

function MyComponent() {
  const { theme, setTheme } = useThemeStore();
  
  return (
    <div>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
    </div>
  );
}
```

## Access Control

The layout system implements multi-level access control:

1. **Authentication check** - User must be logged in
2. **Role check** - User must have appropriate role
3. **Tier check** - User must have appropriate membership tier
4. **Permission check** - User must have specific permissions

## Accessibility

The layout components follow accessibility best practices:

- ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Color contrast compliance
- Semantic HTML structure
- Skip links for navigation

## Browser Support

The layout components support all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Customization

The layout components can be customized through:

1. **Theme configuration** in `tailwind.config.js`
2. **Colors** through CSS custom properties
3. **Navigation items** in `Sidebar.tsx`
4. **User menu items** in `Header.tsx`
5. **Footer content** in `Footer.tsx`

## Performance

The layout components are optimized for performance:

- Lazy loading of components
- Minimal re-renders
- Efficient state management
- CSS-only animations
- Optimized icons and assets
