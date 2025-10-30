# Notification API Service

The Notification API service provides comprehensive functionality for managing notifications, messages, and real-time communication within the ISSB platform.

## Features

### Notification Management
- **CRUD Operations**: Create, read, update, and delete notifications
- **Filtering & Pagination**: Filter by type, read status, date range, and more
- **Bulk Operations**: Mark multiple notifications as read/delete
- **Priority Handling**: Support for urgent and high-priority notifications
- **Expiration**: Automatic cleanup of expired notifications

### Real-time Notifications
- **Push Notifications**: Web push notifications for browsers
- **In-app Notifications**: Real-time in-app notification delivery
- **Channel Management**: Email, SMS, push, and in-app notification channels
- **Platform Support**: Web, iOS, and Android push notification support

### Subscription Management
- **Topic Subscriptions**: Subscribe to notifications by topic/event
- **Resource Subscriptions**: Subscribe to specific opportunities, events, or applications
- **Channel Preferences**: Configure preferred delivery channels per subscription
- **Frequency Control**: Immediate, hourly, daily, or weekly digest options

### Notification Preferences
- **Granular Control**: Enable/disable specific notification types per channel
- **Quiet Hours**: Define quiet hours for each notification channel
- **Working Hours**: Configure business hours for notification delivery
- **Default Templates**: Reset to platform-default notification templates

### Message System
- **Direct Messaging**: Send messages between users
- **Broadcasts**: Send broadcast messages to user groups or roles
- **Conversations**: View conversation history between users
- **Message Priority**: Normal, high, urgent priority levels
- **Attachments**: Support for file attachments in messages

### Analytics & Reporting
- **Delivery Statistics**: Track notification delivery rates and status
- **Engagement Metrics**: Monitor open rates, click rates, and user engagement
- **Channel Performance**: Analyze performance by delivery channel
- **User Analytics**: Individual user notification engagement statistics

## Usage

### Import the API Service

```typescript
import { notificationApi } from '@/api';
// or
import { notificationApi } from '@/api/notifications';
```

### Example Usage

#### Basic Notification Management

```typescript
import { notificationApi } from '@/api';

// Get all notifications for current user
const notifications = await notificationApi.getNotifications({
  page: 1,
  limit: 20,
  type: ['volunteer', 'event'],
  read: false,
});

// Mark notification as read
const updated = await notificationApi.markAsRead('notif-123');

// Mark multiple notifications as read
await notificationApi.markMultipleAsRead(['notif-123', 'notif-124']);

// Get unread notification count
const unreadCount = await notificationApi.getUnreadCount();
console.log(`You have ${unreadCount.total} unread notifications`);

// Delete a notification
await notificationApi.deleteNotification('notif-123');
```

#### Real-time Push Notifications

```typescript
// Register for push notifications
const registration = await notificationApi.registerPushNotifications(
  'push-token-here',
  'web'
);

// Test push notification
await notificationApi.testPushNotification();

// Check push notification status
const status = await notificationApi.getPushStatus();
console.log('Push registered:', status.registered);
```

#### Subscription Management

```typescript
// Get all subscriptions
const subscriptions = await notificationApi.getSubscriptions();

// Create new subscription
const newSubscription = await notificationApi.createSubscription({
  userId: 'user-123',
  type: 'volunteer',
  categories: ['interpreting', 'training'],
  channels: ['in_app', 'email'],
  frequency: 'immediate',
  enabled: true,
});

// Subscribe to event notifications
const eventSub = await notificationApi.subscribeToEvents('event-456', [
  'in_app',
  'push',
  'email',
]);

// Toggle subscription
const toggled = await notificationApi.toggleSubscription('sub-123', false);
```

#### Notification Preferences

```typescript
// Get current preferences
const preferences = await notificationApi.getPreferences();

// Update email notification preferences
const updatedPrefs = await notificationApi.updatePreferences({
  email: {
    enabled: true,
    types: ['volunteer', 'event', 'membership'],
    quietHours: {
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York',
    },
  },
  push: {
    enabled: true,
    types: ['volunteer', 'event'],
  },
  inApp: {
    enabled: true,
    types: ['volunteer', 'event', 'membership', 'system'],
    showOnLockScreen: true,
    sound: true,
  },
});

// Toggle specific channel for notification type
await notificationApi.toggleChannel('volunteer', 'email', false);
```

#### Message System

```typescript
// Get messages
const messages = await notificationApi.getMessages({
  page: 1,
  limit: 20,
  read: false,
});

// Send a message
const newMessage = await notificationApi.sendMessage({
  senderId: 'user-123',
  recipientId: 'user-456',
  subject: 'Question about volunteer opportunity',
  content: 'Hi, I have a question about the interpreting opportunity...',
  type: 'direct',
  priority: 'normal',
});

// Get conversation with specific user
const conversation = await notificationApi.getConversation('user-456', {
  page: 1,
  limit: 50,
});

// Mark message as read
await notificationApi.markMessageAsRead('msg-123');
```

#### Analytics & Statistics

```typescript
// Get notification statistics
const stats = await notificationApi.getStats({
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-10-29'),
});

console.log({
  total: stats.total,
  unread: stats.unread,
  byType: stats.byType,
  engagementRate: stats.engagementRate,
});

// Get delivery status for specific notification
const deliveryStatus = await notificationApi.getDeliveryStatus('notif-123');
console.log('Status:', deliveryStatus.status);
console.log('Channels:', deliveryStatus.channels);
```

#### Notification Templates

```typescript
// Get notification templates
const templates = await notificationApi.getTemplates();

// Update email template for volunteer notifications
await notificationApi.updateTemplate(
  'volunteer',
  'email',
  'Dear {{userName}}, A new volunteer opportunity matching your skills...'
);

// Reset template to default
await notificationApi.resetTemplate('volunteer', 'email');
```

## API Methods

### Notification Management

| Method | Description | Parameters |
|--------|-------------|------------|
| `getNotifications(params?)` | Get paginated notifications | Optional query params |
| `getNotification(id)` | Get single notification | Notification ID |
| `markAsRead(id)` | Mark notification as read | Notification ID |
| `markMultipleAsRead(ids)` | Mark multiple as read | Array of IDs |
| `markAllAsRead()` | Mark all as read | None |
| `deleteNotification(id)` | Delete notification | Notification ID |
| `deleteMultiple(ids)` | Delete multiple | Array of IDs |
| `deleteAll()` | Delete all | None |
| `getUnreadCount()` | Get unread count | None |
| `create(data)` | Create notification | Notification data |
| `sendToUser(userId, data)` | Send to specific user | User ID and data |
| `sendBroadcast(data)` | Send broadcast | Broadcast data |

### Preferences & Settings

| Method | Description | Parameters |
|--------|-------------|------------|
| `getPreferences()` | Get user preferences | None |
| `updatePreferences(prefs)` | Update preferences | Preferences object |
| `resetPreferences()` | Reset to defaults | None |
| `toggleChannel(type, channel, enabled)` | Toggle channel | Type, channel, enabled |

### Subscriptions

| Method | Description | Parameters |
|--------|-------------|------------|
| `getSubscriptions()` | Get user subscriptions | None |
| `getSubscription(id)` | Get single subscription | Subscription ID |
| `createSubscription(data)` | Create subscription | Subscription data |
| `updateSubscription(id, updates)` | Update subscription | ID and updates |
| `deleteSubscription(id)` | Delete subscription | Subscription ID |
| `toggleSubscription(id, enabled)` | Toggle enabled state | ID and enabled |
| `subscribeToEvents(eventId, channels?)` | Subscribe to event | Event ID and channels |
| `subscribeToVolunteer(opportunityId, channels?)` | Subscribe to opportunity | Opportunity ID and channels |
| `subscribeToApplications(applicationId, channels?)` | Subscribe to application | Application ID and channels |
| `unsubscribeFromResource(type, id)` | Unsubscribe from resource | Resource type and ID |

### Real-time & Push

| Method | Description | Parameters |
|--------|-------------|------------|
| `registerPush(token, platform)` | Register push | Token and platform |
| `unregisterPush(token?)` | Unregister push | Optional token |
| `testPush()` | Test push notification | None |
| `getPushStatus()` | Get push status | None |

### Messages

| Method | Description | Parameters |
|--------|-------------|------------|
| `getMessages(params?)` | Get messages | Optional query params |
| `getMessage(id)` | Get single message | Message ID |
| `sendMessage(data)` | Send message | Message data |
| `markMessageAsRead(id)` | Mark message as read | Message ID |
| `deleteMessage(id)` | Delete message | Message ID |
| `getConversation(userId, params?)` | Get conversation | User ID and params |

### Analytics & Templates

| Method | Description | Parameters |
|--------|-------------|------------|
| `getStats(dateRange?)` | Get notification stats | Optional date range |
| `getAnalytics(dateRange?)` | Get delivery analytics | Optional date range |
| `getTemplates()` | Get notification templates | None |
| `updateTemplate(type, channel, template)` | Update template | Type, channel, template |
| `resetTemplate(type, channel)` | Reset template | Type, channel |
| `getDeliveryStatus(id)` | Get delivery status | Notification ID |

## TypeScript Support

The service is fully typed with TypeScript:

```typescript
import type {
  Notification,
  NotificationType,
  Message,
  MessageType,
  NotificationSubscription,
  NotificationPreferences,
  NotificationChannel,
  NotificationFrequency,
} from '@/api/notifications';
```

## Error Handling

Consistent error handling across all methods:

```typescript
try {
  const notifications = await notificationApi.getNotifications();
} catch (error) {
  const { message, code, status } = handleApiError(error);
  console.error('Failed to fetch notifications:', message);
}
```

## Notification Types

- `membership` - Membership-related notifications
- `application` - Application status updates
- `event` - Event notifications
- `volunteer` - Volunteer opportunity notifications
- `system` - System alerts and maintenance
- `message` - Direct messages from other users
- `reminder` - Reminder notifications

## Message Types

- `direct` - Direct message between users
- `broadcast` - Broadcast message to multiple users
- `announcement` - Official announcements
- `system` - System-generated messages

## Notification Channels

- `email` - Email notifications
- `push` - Web/mobile push notifications
- `sms` - SMS text messages
- `in_app` - In-app notification banners

## Best Practices

1. **Respect User Preferences**: Always check and respect user notification preferences
2. **Use Appropriate Channels**: Choose the right channel based on notification urgency
3. **Implement Unsubscribe**: Provide easy unsubscribe options for all notification types
4. **Rate Limiting**: Implement rate limiting for notification sending
5. **Accessibility**: Ensure notifications are accessible to all users
6. **Privacy**: Handle user data and communication with appropriate privacy measures
7. **Real-time Updates**: Use subscriptions for real-time updates when possible
8. **Message Formatting**: Use proper formatting and templates for consistent user experience

## Integration with Other Services

- **Volunteer API**: Automatic notifications for volunteer opportunity updates
- **Event API**: Event-related notification subscriptions
- **Auth Service**: User preference management
- **Real-time Service**: WebSocket connections for live notifications

## Support

For API support or notification issues, contact the development team or refer to the API documentation.
