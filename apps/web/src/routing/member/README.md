# Member Routes Documentation

This directory contains all protected member routes with role-based access control and navigation guards for the member portal.

## Directory Structure

```
/routing/member/
├── index.tsx                          # Main member routes aggregator
├── dashboard.routes.tsx               # Dashboard and analytics routes
├── profile.routes.tsx                 # Profile management routes
├── membership.routes.tsx              # Membership management routes
├── event-registration.routes.tsx      # Event registration routes
├── volunteer-opportunities.routes.tsx # Volunteer opportunity routes
├── application-status.routes.tsx      # Application status routes
├── navigation-guards.tsx              # Reusable navigation guards
└── README.md                          # This documentation
```

## Features

### 🔒 Role-based Access Control
- **Member**: Basic member access to personal features
- **Board**: Board member access to management features
- **Admin**: Full administrative access

### 🎯 Tier-based Permissions
- **Bronze**: Basic tier access
- **Silver**: Enhanced features access
- **Gold**: Premium features access
- **Platinum**: Full feature access

### 🛡️ Navigation Guards
Comprehensive guard system for:
- Authentication verification
- Role and tier validation
- Membership status checking
- Resource ownership verification
- Time-based access control

### 📋 Route Categories

#### 1. Dashboard Routes (`/member/dashboard/`)
- Member dashboard overview
- Analytics and statistics
- Dashboard customization
- Quick actions
- Member activity tracking

#### 2. Profile Routes (`/member/profile/`)
- View and edit personal profile
- Profile picture management
- Privacy settings
- Security settings
- Notification preferences
- Admin/board member viewing

#### 3. Membership Routes (`/member/membership/`)
- Membership overview and details
- Tier upgrade/downgrade
- Payment management
- Renewal and auto-renewal
- Invoice and receipt access
- Cancellation and reactivation

#### 4. Event Registration Routes (`/member/events/`)
- Event browsing and filtering
- Registration and cancellation
- Waitlist management
- Event calendar view
- Registration history
- Event feedback

#### 5. Volunteer Opportunities Routes (`/member/volunteering/`)
- Opportunity browsing
- Application submission
- Skills matching
- Impact tracking
- Hours logging
- Training access

#### 6. Application Status Routes (`/member/applications/`)
- Application overview
- Draft and submitted applications
- Status tracking
- Document management
- Resubmission handling
- Review workflow (board/admin)

## Navigation Guards Usage

### Basic Guards
```tsx
import { AuthGuard, RoleGuard, TierGuard, MembershipStatusGuard } from '@/routing/member/navigation-guards';

// Authentication required
<AuthGuard>
  <ProtectedComponent />
</AuthGuard>

// Role-based access
<RoleGuard allowedRoles={['member', 'board']}>
  <Component />
</RoleGuard>

// Tier-based access
<TierGuard allowedTiers={['silver', 'gold', 'platinum']}>
  <PremiumComponent />
</TierGuard>

// Membership status check
<MembershipStatusGuard allowedStatuses={['active', 'pending']} action="register for events">
  <EventRegistrationComponent />
</MembershipStatusGuard>
```

### Convenience Guards
```tsx
import { MemberGuard, BoardGuard, AdminGuard, PremiumGuard } from '@/routing/member/navigation-guards';

// Member access (member, board, or admin)
<MemberGuard>
  <MemberComponent />
</MemberGuard>

// Board access (board or admin)
<BoardGuard>
  <BoardComponent />
</BoardGuard>

// Admin access only
<AdminGuard>
  <AdminComponent />
</AdminGuard>

// Premium tier access (silver+)
<PremiumGuard>
  <PremiumComponent />
</PremiumGuard>
```

### Advanced Guards
```tsx
import { FeatureGuard, OwnershipGuard, TimeBasedGuard } from '@/routing/member/navigation-guards';

// Comprehensive feature access check
<FeatureGuard 
  requiresActiveMembership={true}
  requiresVolunteerApproval={true}
  requiredRoles={['member']}
  requiredTiers={['silver']}
  customMessage="Enhanced features require silver membership and volunteer approval"
>
  <AdvancedComponent />
</FeatureGuard>

// Ownership verification
<OwnershipGuard ownerId={resource.ownerId}>
  <ResourceComponent />
</OwnershipGuard>

// Time-based access
<TimeBasedGuard startDate={new Date('2024-01-01')} endDate={new Date('2024-12-31')}>
  <TimeSensitiveComponent />
</TimeBasedGuard>
```

## Route Protection Levels

### Public Routes
- None in member routes (all require authentication)

### Member-level Protection
- Basic member dashboard
- Personal profile management
- Membership overview
- Event browsing

### Board-level Protection
- Member management
- Application review
- Event management
- Volunteer program oversight

### Admin-level Protection
- System-wide analytics
- User management
- Application settings
- Complete data access

### Tier-based Restrictions
- **Bronze**: Basic features only
- **Silver+**: Member directory, forums
- **Gold+**: Networking features, premium events
- **Platinum**: All features, exclusive access

## Integration with App.tsx

To integrate member routes in your main App.tsx:

```tsx
import MemberRoutes from '@/routing/member';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected member routes */}
        <Route
          path="/member/*"
          element={
            <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
              <MemberLayout>
                <MemberRoutes />
              </MemberLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Other protected routes */}
        {/* ... */}
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}
```

## Security Considerations

### Access Control
- All routes require authentication
- Role-based access is enforced at route level
- Tier restrictions prevent unauthorized feature access
- Ownership validation protects user data

### Data Protection
- Users can only access their own applications
- Board/admin users have elevated access with appropriate checks
- Sensitive operations require active membership status
- Suspensions are respected across all features

### Rate Limiting
- Consider implementing rate limiting for sensitive operations
- File upload routes should have size and frequency limits
- API calls should be monitored for abuse

## Best Practices

### Route Organization
- Group related routes in feature-specific files
- Use clear, descriptive route names
- Implement proper fallbacks for all routes
- Document complex access requirements

### Guard Usage
- Use the most restrictive guard that meets requirements
- Provide clear error messages for access denials
- Implement fallback UI components for better UX
- Test guard combinations thoroughly

### Performance
- Guards should be lightweight and efficient
- Avoid unnecessary API calls in guards
- Cache permission checks when possible
- Optimize guard nesting to minimize re-renders

## Error Handling

### Unauthorized Access
- Clear error messages explaining access requirements
- Suggest appropriate upgrade paths for tier restrictions
- Provide contact information for support assistance

### 404 Handling
- Graceful fallbacks for non-existent routes
- Suggest valid alternatives when possible
- Log access attempts for security monitoring

## Testing Considerations

### Route Testing
- Test all access levels (member, board, admin)
- Verify tier-based restrictions work correctly
- Test ownership validation scenarios
- Validate error message content

### Guard Testing
- Test guard combinations for edge cases
- Verify fallback behaviors
- Test time-based restrictions
- Validate custom error messages

## Future Enhancements

### Planned Features
- Advanced analytics dashboard
- Real-time notifications
- Mobile-responsive layouts
- Progressive Web App features

### Accessibility
- ARIA label implementation
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

## Contributing

When adding new member routes:

1. Follow the established file structure
2. Implement appropriate navigation guards
3. Add comprehensive route documentation
4. Include error handling for edge cases
5. Test with different user roles and tiers
6. Update this README for new features

## Support

For questions about member routing implementation:
- Review existing route examples
- Check navigation guard documentation
- Consult with the development team
- Test thoroughly before deployment