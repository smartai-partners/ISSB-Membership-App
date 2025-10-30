# Quick Implementation Guide - Layout Components

## 🚀 Quick Start

### 1. Using Layouts in Your Pages

```tsx
// For regular member pages
import { MemberLayout } from '@/layouts';

export default function MyPage() {
  return (
    <MemberLayout>
      <YourPageContent />
    </MemberLayout>
  );
}

// For board member pages
import { BoardLayout } from '@/layouts';

export default function BoardPage() {
  return (
    <BoardLayout>
      <YourBoardContent />
    </BoardLayout>
  );
}

// For admin pages
import { AdminLayout } from '@/layouts';

export default function AdminPage() {
  return (
    <AdminLayout>
      <YourAdminContent />
    </AdminLayout>
  );
}

// For auth pages (login, register, etc.)
import { AuthLayout } from '@/layouts';

export default function AuthPage() {
  return (
    <AuthLayout>
      <YourAuthForm />
    </AuthLayout>
  );
}
```

### 2. Using Individual Layout Components

```tsx
// Import specific components
import { Layout, Header, Sidebar, Footer } from '@/components/layout';

export default function CustomPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-1 flex-col">
        <Header 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        <main className="flex-1">
          <YourContent />
        </main>
        <Footer />
      </div>
    </div>
  );
}
```

### 3. Theme Management

```tsx
import { useThemeStore } from '@/store/themeStore';

// In any component
function ThemeControls() {
  const { theme, setTheme, isDarkMode } = useThemeStore();
  
  return (
    <div className="flex items-center gap-2">
      <span>Theme: {theme}</span>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}
```

### 4. Access Control

```tsx
// Check if user can access a resource
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';

function MyComponent() {
  const { user } = useAuthStore();
  const { hasRole, hasTier, canPerformAction } = usePermissionStore();
  
  if (user) {
    // Check role
    const canAccess = hasRole(user, ['admin', 'board']);
    
    // Check tier
    const canVolunteer = hasTier(user, ['board', 'admin']);
    
    // Check specific permission
    const canManageUsers = canPerformAction(user, 'manage_users');
  }
  
  return <div>Content</div>;
}
```

## 📋 Component Props

### Layout Component
```tsx
interface LayoutProps {
  children: React.ReactNode;
}
```

### Header Component
```tsx
interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}
```

### Sidebar Component
```tsx
interface SidebarProps {
  isOpen: boolean;
  isMobile?: boolean;
}
```

### Footer Component
```tsx
// No props required
```

### NavItem Type
```tsx
interface NavItem {
  name: string;              // Display name
  href: string;               // Route path
  icon: React.ComponentType;  // Icon component
  allowedRoles?: string[];    // Optional: role restrictions
  allowedTiers?: string[];    // Optional: tier restrictions
  badge?: string;             // Optional: badge text
}
```

## 🎨 Styling Guidelines

### Using Tailwind Classes

```tsx
// Basic layout
<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
  <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    {/* Content */}
  </div>
</div>

// Cards
<div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
  {/* Card content */}
</div>

// Buttons
<button className="rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
  Button Text
</button>

// Form inputs
<input className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
```

### Custom Colors

The layout uses these custom colors:

```css
/* Primary colors */
text-primary-600       /* Primary text */
bg-primary-50          /* Primary background */
border-primary-500     /* Primary border */

/* Dark mode */
dark:bg-gray-900       /* Dark background */
dark:text-white        /* Dark text */

/* Tier colors */
text-red-700 bg-red-100        /* Admin tier */
text-yellow-700 bg-yellow-100  /* Board tier */
text-slate-700 bg-slate-100    /* Regular tier */
```

## 🔄 Common Patterns

### Page with Header and Content

```tsx
import { MemberLayout } from '@/layouts';

export default function MyPage() {
  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Page Title
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Page description
          </p>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          {/* Page content */}
        </div>
      </div>
    </MemberLayout>
  );
}
```

### Form Page

```tsx
import { AuthLayout } from '@/layouts';

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Sign in to your account
          </h2>
        </div>
        
        <form className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          
          <button
            type="submit"
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            Sign in
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
```

### Data Table Page

```tsx
import { BoardLayout } from '@/layouts';

export default function MembersPage() {
  return (
    <BoardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Member Management</h1>
          <button className="rounded-md bg-primary-600 px-4 py-2 text-white">
            Add Member
          </button>
        </div>
        
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Table rows */}
            </tbody>
          </table>
        </div>
      </div>
    </BoardLayout>
  );
}
```

## ⚠️ Important Notes

1. **Always wrap authenticated pages in the appropriate layout**
   - Use `MemberLayout`, `BoardLayout`, or `AdminLayout`
   - Never use `Layout` directly in route definitions

2. **Use the theme store for theme-related functionality**
   - Import from `@/store/themeStore`
   - Do not implement your own theme logic

3. **Use permission store for access control**
   - Import from `@/store/permissionStore`
   - Check permissions before rendering sensitive content

4. **Follow the established patterns**
   - Use TailwindCSS classes
   - Maintain consistent spacing
   - Follow the color scheme

5. **Test on mobile devices**
   - All components are responsive
   - Test the sidebar toggle on mobile
   - Ensure touch targets are large enough

## 🐛 Troubleshooting

### Layout not rendering
- Check if user is authenticated
- Verify the correct layout is imported
- Check console for errors

### Sidebar not showing on mobile
- Verify `isMobile` prop is passed to `Sidebar`
- Check z-index values
- Ensure overlay is rendering

### Theme not persisting
- Check if `themeStore` is properly imported
- Verify localStorage is not disabled
- Clear localStorage and try again

### Navigation items not showing
- Check role and tier restrictions
- Verify user permissions
- Check navigation filter logic

## 📚 Additional Resources

- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
