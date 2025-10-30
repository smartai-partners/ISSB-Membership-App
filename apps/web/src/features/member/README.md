# Member Portal Components

This directory contains React components for the member portal section of the application. These components provide comprehensive functionality for members to manage their profiles, view membership details, browse events, explore volunteer opportunities, and track application statuses.

## Components Overview

### 1. MemberProfile.tsx
A comprehensive profile management component that allows users to view and edit their personal information.

**Features:**
- Profile view with avatar and membership tier display
- Edit mode with form validation
- Real-time profile updates
- Error handling and loading states
- Responsive design

**Key Functionality:**
- View current profile information
- Edit personal details (name, phone, address, bio)
- Save changes with optimistic updates
- Cancel editing with data restoration

### 2. MembershipDetails.tsx
Detailed membership information display with tabs for different views.

**Features:**
- Membership overview with tier and benefits
- Payment history tracking
- Tier change history
- Tabbed interface for organized information

**Key Functionality:**
- Display membership tier and status
- List benefits and perks
- Show payment history with status indicators
- Track membership tier changes over time
- Show next payment information

### 3. EventList.tsx
Comprehensive event browsing and registration system.

**Features:**
- Event grid with search and filtering
- Registration/unregistration functionality
- Event categories and status indicators
- Load more pagination
- Responsive card layout

**Key Functionality:**
- Browse upcoming and past events
- Filter by event type and registration status
- Search events by title, description, or tags
- Register/unregister for events
- View event capacity and deadline information

### 4. VolunteerOpportunities.tsx
Volunteer opportunity discovery and application system.

**Features:**
- Opportunity listing with urgency indicators
- Application modal with availability selection
- Skill matching and impact information
- Contact information display

**Key Functionality:**
- Browse volunteer opportunities by urgency
- Filter by urgency level and search terms
- Apply for opportunities with availability and motivation
- View impact statements and required skills
- Track application status

### 5. ApplicationStatus.tsx
Complete application tracking system with detailed status information.

**Features:**
- Application list with status indicators
- Detailed view modal with milestones
- Document tracking and status
- Application withdrawal and resubmission

**Key Functionality:**
- Track multiple application types (membership, volunteer, event, board, etc.)
- View detailed application progress
- Monitor milestone completion
- Download associated documents
- Withdraw or resubmit applications as needed

## Data Flow and Patterns

### Data Fetching
All components follow consistent data fetching patterns:
- Loading states during initial fetch and operations
- Error handling with retry capabilities
- Optimistic updates for immediate UI feedback
- Pagination support where applicable

### State Management
- Components use React hooks for local state
- Integration with Zustand auth store for user data
- Form state management with validation
- Loading and error state tracking

### Error Handling
- Graceful error display with user-friendly messages
- Retry mechanisms for failed operations
- Network error handling
- Form validation with detailed feedback

### User Experience
- Consistent loading spinners and skeletons
- Empty states with helpful messaging
- Responsive design for all screen sizes
- Accessible components with proper ARIA labels
- Intuitive navigation and interaction patterns

## Usage Example

```tsx
import { 
  MemberProfile, 
  MembershipDetails, 
  EventList, 
  VolunteerOpportunities, 
  ApplicationStatus 
} from '@/features/member';

// Within your router or page component
const MemberPortal: React.FC = () => {
  return (
    <div>
      <MemberProfile />
      <MembershipDetails />
      <EventList />
      <VolunteerOpportunities />
      <ApplicationStatus />
    </div>
  );
};
```

## Integration Requirements

### Dependencies
- React 18+
- Lucide React icons
- Tailwind CSS
- Existing UI components (Button, Card, Input, Modal)

### API Integration
Components include mock API calls that should be replaced with actual endpoints:
- Profile data fetching and updates
- Membership information retrieval
- Event listing and registration
- Volunteer opportunity browsing and applications
- Application status tracking

### Routing
Each component can be used as a standalone page or integrated into a tabbed interface. Recommended routes:
- `/member/profile` - MemberProfile
- `/member/membership` - MembershipDetails  
- `/member/events` - EventList
- `/member/volunteer` - VolunteerOpportunities
- `/member/applications` - ApplicationStatus

## Extensibility

The components are designed to be easily extensible:
- Type definitions are comprehensive and can be extended
- Component props allow for customization
- Data structures support additional fields
- Styling can be customized through Tailwind classes
- API integration points are well-defined

## Accessibility

All components follow accessibility best practices:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast color schemes
- Focus management in modals and forms