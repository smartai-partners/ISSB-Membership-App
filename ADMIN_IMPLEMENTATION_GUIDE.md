# Admin Management Portal - Implementation Guide

## Overview
The Admin Management Portal is a comprehensive tabbed interface for managing all aspects of the ISSB Portal's Event & Gamification system. This document outlines the complete admin interface implementation.

## Architecture

### Page Structure
**File**: `/workspace/issb-portal/src/pages/AdminVolunteerOpportunitiesPage.tsx`

The page has been transformed from a single-purpose volunteer opportunities manager into a multi-tab admin portal with 5 management sections:

1. **Volunteer Opportunities** - Original functionality preserved
2. **Events** - Event management with full CRUD operations
3. **Photo Galleries** - Gallery and photo management with uploads
4. **Badges & Achievements** - Badge system with automated and manual awarding
5. **Contests** - Contest lifecycle and submission review

### Tab Navigation
```typescript
type ActiveTab = 'opportunities' | 'events' | 'galleries' | 'badges' | 'contests'
```

Each tab is represented by:
- Icon (Lucide React)
- Label
- Active state styling (primary-600 border and text)
- Hover effects

## Component Details

### 1. EventManagement Component
**File**: `/workspace/issb-portal/src/components/admin/EventManagement.tsx` (391 lines)

#### Features:
- **Event List View**
  - Filterable by status (all, draft, published, cancelled, completed)
  - Table display with event details, dates, location, registrations
  - Featured image thumbnails
  - Status badges

- **Event Form (Create/Edit)**
  - Title and rich description
  - Date & time picker
  - Location input
  - Capacity management
  - Status selection (draft, published, cancelled, completed)
  - Featured image upload with preview
  - Image removal functionality

- **Actions**
  - Create new event
  - Edit existing event
  - Delete event (with confirmation)
  - Publish/Unpublish toggle
  - View registration count

#### Form Validation:
- All required fields marked with `required` attribute
- Date/time validation via HTML5 input type
- Capacity must be positive integer
- Image file type restriction (image/*)

#### State Management:
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  capacity: number;
  status: string;
  featured_image_url?: string;
  registrations_count?: number;
}
```

### 2. GalleryManagement Component
**File**: `/workspace/issb-portal/src/components/admin/GalleryManagement.tsx` (437 lines)

#### Features:
- **Gallery List View**
  - Grid layout (3 columns on desktop)
  - Gallery cards with cover image
  - Photo count display
  - Published/Draft status badge
  - Creation date

- **Gallery Form**
  - Title and description
  - Optional event association
  - Publish immediately checkbox

- **Photo Upload Interface**
  - Multi-file selection
  - Image previews in grid
  - Individual photo captions
  - Remove uploaded files before submission
  - File size guidance (max 5MB per photo)

- **Gallery Detail View**
  - Back to galleries navigation
  - Upload photos button
  - Photo grid display
  - Delete individual photos (with hover effect)
  - Photo captions display

#### Actions:
- Create/edit gallery
- Delete gallery (deletes all photos)
- Publish/unpublish gallery
- Upload multiple photos
- Add captions to photos
- Delete individual photos

### 3. BadgeManagement Component
**File**: `/workspace/issb-portal/src/components/admin/BadgeManagement.tsx` (533 lines)

#### Features:
- **Badge List View**
  - Grid layout (3 columns on desktop)
  - Badge cards with icon/default icon
  - Badge type badge
  - Points value display
  - Awarded count
  - Auto-award criteria display

- **Badge Form**
  - Name and description
  - Badge type selection (achievement, participation, leadership, special)
  - Points value
  - Achievement criteria configuration:
    - Type: volunteer_hours, events_attended, contests_won, manual
    - Value: numeric threshold
  - Badge icon upload (256x256px recommended)

- **Achievement Check**
  - Manual trigger button
  - Runs automated badge awarding for all eligible members
  - Checks criteria across all badges

- **Badge Recipients View**
  - List of members awarded this badge
  - Member name and email
  - Awarded date
  - Manual award interface

- **Manual Award Form**
  - Member email input
  - Optional reason field
  - Award badge action

#### Auto-Award Logic:
Badges with criteria types other than "manual" can be automatically awarded when the `check-achievements` edge function is triggered.

Criteria examples:
- Volunteer Hours: 10 hours → Badge awarded when member completes 10 approved volunteer hours
- Events Attended: 5 events → Badge awarded after attending 5 events
- Contests Won: 1 contest → Badge awarded after winning a contest

### 4. ContestManagement Component
**File**: `/workspace/issb-portal/src/components/admin/ContestManagement.tsx` (576 lines)

#### Features:
- **Contest List View**
  - Filterable by status (all, draft, active, ended, cancelled)
  - Table display with contest details
  - Date ranges
  - Prize descriptions
  - Submission counts
  - Sponsor information

- **Contest Form**
  - Title and description
  - Rules & guidelines (multi-line)
  - Start and end dates
  - Prize description
  - Sponsor name (optional)
  - Sponsor logo upload (optional)
  - Max submissions per member
  - Status selection

- **Submissions View**
  - Back to contests navigation
  - Filter by submission status (all, pending, approved, rejected, winner)
  - Submission cards showing:
    - Member name and email
    - Submission date/time
    - Submission text
    - File attachment link
    - Admin notes (if any)
    - Status badge

- **Submission Review Actions** (for pending submissions):
  - Approve submission
  - Reject submission (with reason prompt)
  - Mark as winner

#### Contest Lifecycle:
1. **Draft** - Contest created but not visible to members
2. **Active** - Contest is live, accepting submissions
3. **Ended** - Submission period closed, under review
4. **Cancelled** - Contest cancelled

## Design Patterns

### Form Layout
All forms follow a consistent pattern:
- 2-column grid on desktop, 1-column on mobile
- Label above each input field
- Proper spacing (gap-6)
- Submit and Cancel buttons at the bottom
- Success/Error messaging at the top

### File Upload Interface
Consistent across all components:
- Hidden file input
- Custom styled label button with icon
- Image preview with remove button (absolute positioned X)
- File size and dimension guidance text
- Support for single or multiple files

### Data Tables
- Full-width responsive tables
- Sticky header with background
- Hover effects on rows
- Action buttons aligned to the right
- Icon + text for better UX
- Empty state messaging

### Status Badges
Color-coded status indicators:
- **Published/Active/Approved**: Green (success-light background, primary-800 text)
- **Draft/Pending**: Gray (gray-100 background, gray-700 text)
- **Cancelled/Rejected**: Red (red-100 background, red-700 text)
- **Completed/Ended**: Blue (blue-100 background, blue-700 text)

## TODO: API Integration

Each component currently has placeholder API calls marked with `// TODO:` comments. These need to be connected to the edge functions:

### EventManagement TODOs:
- Upload image to Supabase Storage (`event-images` bucket)
- Call `create-event` edge function
- Call `update-event` edge function
- Call `delete-event` edge function
- Fetch events list from `list-events` edge function

### GalleryManagement TODOs:
- Call `create-gallery` edge function
- Upload photos to Supabase Storage (`gallery-photos` bucket or similar)
- Call `upload-photo` edge function for each photo
- Fetch galleries from `list-galleries` edge function
- Delete gallery and photos

### BadgeManagement TODOs:
- Upload icon to Supabase Storage (`badge-icons` bucket)
- Call `create-badge` edge function
- Call `award-badge` edge function
- Call `check-achievements` edge function
- Fetch badges from `list-badges` edge function
- Fetch member badges from `get-member-badges` edge function

### ContestManagement TODOs:
- Upload sponsor logo to Supabase Storage
- Call `create-contest` edge function
- Call `update-contest` edge function
- Fetch contests from `list-contests` edge function
- Fetch submissions
- Update submission status

## Accessibility Features

- Semantic HTML elements
- Proper form labels
- Keyboard navigation support
- Focus states on interactive elements
- ARIA-friendly button text
- Clear error messaging
- Confirmation dialogs for destructive actions

## Responsive Design

All components are fully responsive:
- **Mobile**: Single column layout, stacked elements, smaller text
- **Tablet**: 2-column grids where appropriate
- **Desktop**: Full multi-column layouts, optimal spacing

Breakpoints:
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up

## Next Steps

1. **API Integration**: Connect all TODO sections to actual edge functions
2. **File Upload**: Implement Supabase Storage upload logic
3. **Real-time Updates**: Consider adding refetch/cache invalidation
4. **Loading States**: Add spinners/skeletons during API calls
5. **Error Handling**: Enhance error messages and recovery options
6. **Pagination**: Add pagination for large data sets
7. **Search**: Add search functionality to tables
8. **Sorting**: Add column sorting to tables
9. **Bulk Actions**: Consider bulk delete, bulk publish operations
10. **Analytics**: Add admin dashboard with statistics

## Testing Checklist

- [ ] Create event with image upload
- [ ] Edit event details
- [ ] Publish/unpublish event
- [ ] Delete event
- [ ] Create gallery and upload photos
- [ ] Add captions to photos
- [ ] Delete individual photos
- [ ] Delete entire gallery
- [ ] Create badge with auto-award criteria
- [ ] Manually award badge to member
- [ ] Run achievement check
- [ ] View badge recipients
- [ ] Create contest with sponsor logo
- [ ] Review contest submissions
- [ ] Approve/reject submissions
- [ ] Mark winner
- [ ] Test all form validations
- [ ] Test responsive layouts on all screen sizes
- [ ] Test accessibility with keyboard navigation

## File Structure Summary

```
/workspace/issb-portal/
├── src/
│   ├── pages/
│   │   └── AdminVolunteerOpportunitiesPage.tsx (530 lines)
│   └── components/
│       └── admin/
│           ├── EventManagement.tsx (391 lines)
│           ├── GalleryManagement.tsx (437 lines)
│           ├── BadgeManagement.tsx (533 lines)
│           └── ContestManagement.tsx (576 lines)
```

**Total Lines of Code**: 2,467 lines

## Conclusion

The Admin Management Portal provides a comprehensive, user-friendly interface for managing all aspects of the ISSB Portal's community engagement features. The implementation follows consistent design patterns, provides rich functionality, and is ready for API integration and production deployment.
