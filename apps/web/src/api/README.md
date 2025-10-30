# API Services Overview

This document provides an overview of the API services structure for the ISSB (International Sign Services Board) platform.

## Architecture

The API services are organized into modular, feature-specific directories under `/apps/web/src/api/`:

```
src/api/
├── index.ts                  # Main API export and configuration
├── apiClient.ts              # Enhanced Axios API client
├── interceptors.ts           # Request/response interceptors
├── types.ts                  # API-specific types and interfaces
├── config.ts                 # API configuration and endpoints
├── README.md                 # Comprehensive API client documentation
├── volunteer/
│   ├── index.ts             # Volunteer API exports
│   ├── volunteerApi.ts      # Core volunteer API implementation
│   └── README.md            # Volunteer API documentation
├── notifications/
│   ├── index.ts             # Notification API exports
│   ├── notificationApi.ts   # Core notification API implementation
│   └── README.md            # Notification API documentation
```

## Core Principles

### 1. Enhanced API Client Infrastructure
The platform now includes a comprehensive, type-safe API client built on Axios:
- **Full TypeScript Support** - Complete type safety with comprehensive interfaces
- **Advanced Error Handling** - Robust error handling with retry mechanisms and automatic token refresh
- **Modular Interceptors** - Request/response interceptors for auth, error handling, and monitoring
- **File Upload Support** - Single and multiple file uploads with progress tracking
- **Pagination & Search** - Built-in pagination support and advanced search capabilities
- **Performance Monitoring** - Request timing, metrics, and performance tracking

### 2. Type Safety
All API services are fully typed with TypeScript using shared types from `@issb/types`:
- Comprehensive type definitions for all data models
- Input validation with Zod schemas
- Type-safe API responses and error handling

### 3. Error Handling
Consistent error handling patterns across all services:
- Standardized error response format
- Automatic error interceptors
- User-friendly error messages

### 4. Authentication
Automatic authentication handling:
- Token injection via Axios interceptors
- User context propagation
- Permission-based access control

### 5. Performance
Built-in performance optimizations:
- Request/response caching
- Rate limiting protection
- Pagination support
- Efficient filtering

## API Services

### Enhanced API Client (`apiClient.ts`)

**Purpose**: Comprehensive, type-safe API client infrastructure built on Axios

**Key Features**:
- Full TypeScript support with comprehensive type definitions
- Advanced error handling with retry mechanisms and exponential backoff
- Request/response interceptors for authentication, error handling, and monitoring
- File upload support with progress tracking for single and multiple files
- Built-in pagination and search capabilities
- Performance monitoring and metrics collection
- Configurable retry logic with customizable backoff strategies
- Rate limiting protection and request cancellation
- Automatic token refresh and authentication handling

**Typical Use Cases**:
- Making type-safe HTTP requests to any API endpoint
- Uploading files with progress tracking
- Implementing search and filtering functionality
- Handling complex error scenarios with appropriate retry logic
- Monitoring API performance and request metrics
- Managing authentication tokens automatically

**Example**:
```typescript
import { apiClient, endpoints, ApiErrorType } from '@/api';

// Basic GET request
const users = await apiClient.getData(endpoints.users.list);

// Paginated request
const { data, meta } = await apiClient.getPaginatedData(endpoints.events.base, {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

// File upload with progress
const uploadResponse = await apiClient.uploadFile(
  endpoints.upload.avatar,
  file,
  (progress) => console.log(`${progress.percentage}% complete`)
);

// Advanced error handling
try {
  const result = await apiClient.getData('/protected-endpoint');
} catch (error) {
  switch (error.type) {
    case ApiErrorType.AUTHENTICATION_ERROR:
      redirectToLogin();
      break;
    case ApiErrorType.VALIDATION_ERROR:
      showFormErrors(error.validationErrors);
      break;
    case ApiErrorType.RATE_LIMIT_ERROR:
      showRetryMessage(error.retryAfter);
      break;
  }
}
```

### Volunteer API (`volunteer/`)

**Purpose**: Manage volunteer opportunities, applications, and engagement

**Key Features**:
- Volunteer opportunity CRUD operations
- Application management and review workflow
- Skill-based matching and recommendations
- Volunteer profile management
- Analytics and reporting

**Typical Use Cases**:
- Creating and managing volunteer opportunities
- Processing volunteer applications
- Tracking volunteer engagement
- Generating volunteer program reports

**Example**:
```typescript
import { volunteerApi } from '@/api';

const opportunities = await volunteerApi.getOpportunities({
  page: 1,
  limit: 20,
  filters: { type: ['interpreting'], status: ['active'] }
});
```

### Notification API (`notifications/`)

**Purpose**: Handle notifications, messages, and real-time communication

**Key Features**:
- Multi-channel notification delivery (email, push, SMS, in-app)
- Real-time notification subscriptions
- Message system for user communication
- Notification preferences and management
- Delivery analytics and tracking

**Typical Use Cases**:
- Sending event reminders to subscribers
- Delivering volunteer opportunity updates
- Managing user notification preferences
- Real-time in-app notifications
- Internal messaging between users

**Example**:
```typescript
import { notificationApi } from '@/api';

await notificationApi.subscribeToVolunteer('opp-123', ['in_app', 'email']);
const unreadCount = await notificationApi.getUnreadCount();
```

## Configuration

### Enhanced API Configuration (`config.ts`)

The enhanced API client provides comprehensive configuration options:

```typescript
import { API_CONFIG, API_ENDPOINTS } from '@/api';

// Base configuration
export const API_CONFIG = {
  baseURL: 'https://api.yourapp.com/v1',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Comprehensive endpoint definitions
export const API_ENDPOINTS = {
  auth: {
    login: 'v1/auth/login',
    register: 'v1/auth/register',
    me: 'v1/auth/me',
    refresh: 'v1/auth/refresh',
  },
  users: {
    base: 'v1/users',
    list: 'v1/users/list',
    profile: (id: string) => `v1/users/${id}/profile`,
  },
  events: {
    base: 'v1/events',
    upcoming: 'v1/events/upcoming',
    register: (id: string) => `v1/events/${id}/register`,
  },
  // ... many more endpoints
};
```

### Base Configuration (`index.ts`) [Legacy]

```typescript
export const apiConfig = {
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
  },
  rateLimit: {
    requests: 100,
    window: 60000, // 1 minute
  },
};
```

### Environment Variables

```bash
# .env
VITE_API_URL=https://api.yourapp.com/v1
```

### Initialization

The enhanced API client automatically initializes with the application:

```typescript
// New API client (automatic initialization)
import { apiClient } from '@/api';
// Ready to use immediately

// Legacy initialization (backward compatibility)
import { initializeApiClient } from '@/api';
initializeApiClient();
```

## Utility Functions

### Error Handling
```typescript
const { message, code, status } = handleApiError(error);
```

### Query Building
```typescript
const queryString = buildQueryString({ page: 1, limit: 20 });
```

### Permission Checking
```typescript
const hasAccess = hasPermission(userRole, ['admin', 'board']);
```

## Integration Patterns

### 1. Enhanced API Client Integration
The new API client works seamlessly with existing services:
```typescript
// Direct API client usage for raw endpoints
import { apiClient, endpoints } from '@/api';

const users = await apiClient.getData(endpoints.users.list);
const events = await apiClient.getPaginatedData(endpoints.events.base);

// Combined with specific service APIs
import { volunteerApi } from '@/api';
import { notificationApi } from '@/api';

// Subscribe to notifications when user applies for volunteer opportunity
await volunteerApi.apply(applicationData);
await notificationApi.subscribeToApplications(applicationId, ['email']);
```

### 2. Real-time Updates
Combine with WebSocket services for real-time updates:
```typescript
// Listen for application status updates
const { apiClient, volunteerApi, notificationApi } = await import('@/api');

// Use API client for HTTP requests and services for specific functionality
```

### 3. State Management
Integrate with state management (Zustand, Redux, etc.):
```typescript
// Store API data in application state
const { apiClient } = await import('@/api');
const [opportunities, setOpportunities] = useState([]);

useEffect(() => {
  apiClient.getData(endpoints.volunteer.opportunities).then(setOpportunities);
}, []);
```

### 4. Service Integration
API services work together seamlessly:
```typescript
// Subscribe to notifications when user applies for volunteer opportunity
await volunteerApi.apply(applicationData);
await notificationApi.subscribeToApplications(applicationId, ['email']);
```

## Best Practices

### 1. Request Optimization
- Use pagination for list endpoints
- Apply specific filters to reduce data transfer
- Leverage caching for frequently accessed data
- Implement request debouncing for search endpoints

### 2. Error Management
- Always wrap API calls in try-catch blocks
- Provide user-friendly error messages
- Log errors appropriately for debugging
- Implement retry logic for transient failures

### 3. Type Safety
- Import and use TypeScript types from `@issb/types`
- Validate input data before API calls
- Handle optional and required fields correctly
- Use discriminated unions for response types

### 4. Performance
- Cache static data (opportunity types, notification templates)
- Use background requests for non-critical data
- Implement optimistic updates for better UX
- Monitor API response times and optimize

### 5. Security
- Never expose sensitive data in client-side code
- Validate all user inputs on both client and server
- Use HTTPS for all API communications
- Implement proper authentication token handling

### 6. Accessibility
- Ensure notification content is accessible
- Provide alternative formats for important notifications
- Consider users with different accessibility needs
- Implement keyboard navigation for notification UI

## Development Workflow

### 1. Adding New API Endpoints

1. **Define Types**: Add types to `@issb/types` package
2. **Implement Service**: Add methods to appropriate API service
3. **Add Validation**: Create Zod schemas for input validation
4. **Update Documentation**: Add to service README
5. **Write Tests**: Add unit and integration tests

### 2. API Versioning

The API services support versioning through URL paths:
- Current version: `/api/v1/`
- Future versions: `/api/v2/`, `/api/v3/`, etc.

### 3. Testing

Test API services with:
```typescript
// Mock API responses
jest.mock('@/api/volunteer/volunteerApi');

// Test API interactions
const { volunteerApi } = await import('@/api/volunteer');
```

## Monitoring and Analytics

### Client-side Monitoring
- Track API response times
- Monitor error rates and types
- Log user interactions with API

### Server-side Analytics
- Track notification delivery rates
- Monitor API usage patterns
- Generate performance reports

## Security Considerations

### Data Protection
- Encrypt sensitive data in transit and at rest
- Implement proper access controls
- Use secure authentication mechanisms

### Input Validation
- Validate all inputs on client side
- Sanitize user-generated content
- Implement rate limiting

### Privacy
- Handle user data according to privacy policies
- Implement proper data retention policies
- Provide user controls over data usage

## Future Enhancements

### Planned Features
- GraphQL API support
- Enhanced real-time capabilities
- Advanced caching strategies
- Improved offline support
- Mobile-optimized API variants

### Migration Strategy
- Gradual transition from REST to GraphQL
- Backward compatibility maintenance
- Performance optimization
- Enhanced developer experience

## Support and Resources

### Documentation
- **Enhanced API Client**: Comprehensive documentation in `README.md` and inline documentation
- API Reference: Individual service READMEs
- Type Definitions: `@issb/types` package
- Code Examples: Service-specific documentation

### Development Tools
- API Testing: Postman collections available
- Type Checking: TypeScript strict mode
- Linting: ESLint configuration
- Formatter: Prettier integration

### Getting Help
- Check the enhanced API client documentation in `apiClient.ts`, `interceptors.ts`, `types.ts`, and `config.ts`
- Review service-specific documentation
- Check error messages and logs
- Contact development team
- Submit bug reports and feature requests

### API Client Infrastructure Files
- `apiClient.ts` - Main API client class with comprehensive methods
- `interceptors.ts` - Request/response interceptors for auth and error handling
- `types.ts` - API-specific TypeScript types and interfaces
- `config.ts` - API configuration and comprehensive endpoint definitions
- `index.ts` - Main exports and convenience methods

---

For detailed information about specific API services, refer to their individual README files:
- [Enhanced API Client Documentation](README.md)
- [Volunteer API Documentation](volunteer/README.md)
- [Notification API Documentation](notifications/README.md)
