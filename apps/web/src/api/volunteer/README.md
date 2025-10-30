# Volunteer API Service

The Volunteer API service provides comprehensive functionality for managing volunteer opportunities and applications within the ISSB platform.

## Features

### Volunteer Opportunities
- **CRUD Operations**: Create, read, update, and delete volunteer opportunities
- **Filtering & Pagination**: Advanced filtering by type, status, location, skills, and more
- **Publishing & Archiving**: Control opportunity lifecycle with publish/archive functionality
- **Recommendations**: Get personalized opportunity recommendations for users
- **Statistics**: Detailed analytics and reporting for opportunities

### Volunteer Applications
- **Application Management**: Submit, update, and withdraw applications
- **Review Process**: Comprehensive application review workflow for reviewers
- **Bulk Operations**: Bulk review and process multiple applications
- **User Tracking**: Track applications by user and opportunity
- **Status Management**: Real-time status updates throughout the application lifecycle

### Profile & Preferences
- **Volunteer Profiles**: Manage volunteer skills, interests, and availability
- **Skill Management**: Suggest skills and search opportunities by skill matching
- **Background Checks**: Track background check status and certifications
- **Travel Preferences**: Configure travel willingness and distance limits

### Analytics & Statistics
- **Engagement Metrics**: Track volunteer engagement and hours contributed
- **Program Analytics**: Comprehensive volunteer program performance metrics
- **Opportunity Statistics**: Detailed analytics per opportunity
- **Monthly Reports**: Trend analysis and reporting

## Usage

### Import the API Service

```typescript
import { volunteerApi } from '@/api';
// or
import { volunteerApi } from '@/api/volunteer';
```

### Example Usage

```typescript
import { volunteerApi } from '@/api';

// Get all volunteer opportunities
const opportunities = await volunteerApi.getOpportunities({
  page: 1,
  limit: 20,
  filters: {
    type: ['interpreting', 'training'],
    status: ['active'],
    isRemote: true,
  },
});

// Create a new volunteer opportunity
const newOpportunity = await volunteerApi.createOpportunity({
  title: 'Sign Language Interpreter Needed',
  description: 'Looking for certified interpreter for community event...',
  organization: 'Local Community Center',
  type: 'interpreting',
  tier: 'regular',
  // ... other required fields
});

// Apply for a volunteer opportunity
const application = await volunteerApi.apply({
  opportunityId: 'opp-123',
  motivation: 'I have 5 years of experience in...',
  relevantExperience: 'Previous work with similar organizations...',
  availability: 'Available weekends and evenings',
  skillsOffered: ['ASL', 'English', 'Deaf Culture Education'],
});

// Review an application (for reviewers/admin)
const reviewed = await volunteerApi.reviewApplication('app-123', {
  decision: 'accepted',
  reviewNotes: 'Excellent candidate with relevant experience',
  rating: 5,
  interviewRequired: false,
});

// Get volunteer program statistics
const stats = await volunteerApi.getProgramStats();
console.log({
  totalOpportunities: stats.totalOpportunities,
  totalApplications: stats.totalApplications,
  activeOpportunities: stats.activeOpportunities,
});
```

## API Methods

### Volunteer Opportunities

| Method | Description | Parameters |
|--------|-------------|------------|
| `getOpportunities(query)` | Get paginated list of opportunities | Query with filters and pagination |
| `getOpportunity(id)` | Get single opportunity by ID | Opportunity ID |
| `createOpportunity(data)` | Create new opportunity | Opportunity data |
| `updateOpportunity(id, updates)` | Update existing opportunity | ID and update data |
| `deleteOpportunity(id)` | Delete opportunity | Opportunity ID |
| `publishOpportunity(id)` | Publish opportunity (set to active) | Opportunity ID |
| `archiveOpportunity(id, reason?)` | Archive opportunity | ID and optional reason |
| `getUserOpportunities(userId, query?)` | Get opportunities by creator | User ID and query |
| `getRecommended(userId, limit?)` | Get personalized recommendations | User ID and limit |

### Volunteer Applications

| Method | Description | Parameters |
|--------|-------------|------------|
| `getApplications(query)` | Get paginated list of applications | Query with filters |
| `getApplication(id)` | Get single application by ID | Application ID |
| `apply(applicationData)` | Apply for opportunity | Application data |
| `updateApplication(id, updates)` | Update application | ID and update data |
| `withdrawApplication(id, reason?)` | Withdraw application | ID and optional reason |
| `reviewApplication(id, review)` | Review application | ID and review data |
| `bulkReviewApplications(reviews)` | Bulk review multiple apps | Array of reviews |
| `getUserApplications(userId)` | Get applications by user | User ID |
| `getOpportunityApplications(opportunityId)` | Get apps for opportunity | Opportunity ID |

### Statistics & Analytics

| Method | Description | Parameters |
|--------|-------------|------------|
| `getOpportunityStats(opportunityId)` | Get stats for specific opportunity | Opportunity ID |
| `getProgramStats()` | Get overall program statistics | None |
| `getEngagementAnalytics(dateRange?)` | Get engagement analytics | Optional date range |

### Profile & Preferences

| Method | Description | Parameters |
|--------|-------------|------------|
| `getProfile(userId)` | Get volunteer profile | User ID |
| `updateProfile(userId, updates)` | Update volunteer profile | ID and updates |
| `getSkillSuggestions(query)` | Get skill suggestions | Search query |
| `searchBySkills(skills, limit?)` | Search opportunities by skills | Skills array and limit |

## TypeScript Support

All methods are fully typed with TypeScript interfaces:

```typescript
import type {
  VolunteerOpportunity,
  VolunteerApplication,
  VolunteerType,
  OpportunityStatus,
  VolunteerApplicationStatus,
} from '@issb/types';
```

## Error Handling

The API service uses consistent error handling:

```typescript
try {
  const opportunities = await volunteerApi.getOpportunities(query);
} catch (error) {
  const { message, code, status } = handleApiError(error);
  console.error('Failed to fetch opportunities:', message);
}
```

## Validation

Input validation is performed using Zod schemas from `@issb/types`:

- `CreateVolunteerOpportunitySchema` - Validates new opportunity data
- `UpdateVolunteerOpportunitySchema` - Validates opportunity updates
- `ApplyForOpportunitySchema` - Validates application submissions
- `VolunteerOpportunityQuerySchema` - Validates query parameters

Validation errors are automatically caught and formatted with clear error messages.

## Rate Limiting

The API client includes built-in rate limiting (100 requests per minute by default). Handle 429 responses gracefully.

## Authentication

All requests include the user's authentication token automatically through Axios interceptors.

## Caching

Opportunity lists and statistics are cached for 5 minutes to improve performance. You can disable caching per request if needed.

## Best Practices

1. **Use Pagination**: Always use pagination for list endpoints to avoid performance issues
2. **Filter Efficiently**: Use specific filters to reduce data transfer
3. **Handle Errors**: Always wrap API calls in try-catch blocks
4. **Type Safety**: Leverage TypeScript types for better development experience
5. **Cache Management**: Use the built-in caching for frequently accessed data
6. **Real-time Updates**: Use notification subscriptions for real-time updates on application status

## Integration with Other Services

- **Notifications**: Automatically send notifications for application updates
- **Authentication**: Integrates with auth service for user permissions
- **Analytics**: Provides data for dashboard statistics
- **Search**: Works with the search service for skill-based recommendations

## Support

For API support or issues, contact the development team or refer to the API documentation.
