# ISSB Membership App - Adapted Roadmap for Supabase Architecture
**Date:** November 18, 2025
**Goal:** Complete the remaining 65% to make ISSB the best mosque custom app in the market

---

## Architecture Adaptation

### Original Roadmap Assumptions:
- ❌ Node.js/Express backend
- ❌ Prisma ORM
- ❌ MongoDB

### Actual Tech Stack (Current):
- ✅ **Supabase** (PostgreSQL + Edge Functions)
- ✅ **Deno Runtime** for Edge Functions
- ✅ **React + Redux Toolkit + RTK Query**
- ✅ **Row Level Security (RLS)** for authorization
- ✅ **TypeScript** throughout

---

## Phase 1: Complete Event Management System (Week 1-2)

### 1.1 Database Schema Enhancement ✅ (Partially Done)

**Current Status:** Events table exists, needs enhancement

**Required Updates:**

```sql
-- Enhance events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS featured_image_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_required BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_status TEXT CHECK (registration_status IN ('registered', 'waitlisted', 'cancelled', 'attended')),
  registered_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
```

### 1.2 Edge Functions for Events

**Create these Supabase Edge Functions:**

1. **`list-events`** (✅ Exists, needs enhancement)
   - GET endpoint with filtering, pagination, search
   - Support: `?status=published&startDate=...&tags=...&page=1&limit=10`

2. **`create-event`** (✅ Exists, needs enhancement)
   - POST endpoint for board/admin
   - Validation for all fields
   - Auto-generate slug from title

3. **`update-event`** (✅ Exists, needs enhancement)
   - PUT/PATCH endpoint
   - Permission check: creator or admin

4. **`delete-event`** (✅ Exists, needs enhancement)
   - DELETE endpoint
   - Permission check: creator or admin
   - Cascade delete registrations

5. **`register-for-event`** (❌ NEW)
   - POST /register-for-event
   - Check capacity
   - Handle waitlist logic
   - Send confirmation

6. **`cancel-event-registration`** (❌ NEW)
   - DELETE /cancel-event-registration
   - Update capacity
   - Notify waitlisted users

7. **`event-analytics`** (❌ NEW)
   - GET /event-analytics?eventId=...
   - Attendance stats
   - Registration trends
   - Popular events

### 1.3 Frontend Components for Events

**Files to Create/Update:**

```
issb-portal/src/
├── pages/
│   ├── EventsPage.tsx (✅ Exists, enhance)
│   ├── EventDetailPage.tsx (❌ NEW)
│   └── AdminEventsPage.tsx (✅ Exists, enhance)
├── components/events/
│   ├── EventsList.tsx (✅ Exists, enhance)
│   ├── EventCard.tsx (❌ NEW)
│   ├── EventRegistrationForm.tsx (❌ NEW)
│   ├── EventCalendarView.tsx (❌ NEW)
│   └── EventFilters.tsx (❌ NEW)
```

---

## Phase 2: Gallery Integration System (Week 3-4)

### 2.1 Database Schema for Galleries

```sql
-- Galleries table (stores metadata about external galleries)
CREATE TABLE IF NOT EXISTS galleries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  gallery_type TEXT CHECK (gallery_type IN ('pixieset', 'google_drive', 'internal')) NOT NULL,
  external_id TEXT, -- Pixieset collection ID or Google Drive folder ID
  external_url TEXT, -- Direct link to gallery
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint for external galleries
  UNIQUE(gallery_type, external_id)
);

-- Photos table (for internal uploads or cached metadata)
CREATE TABLE IF NOT EXISTS gallery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL, -- Supabase storage URL or external URL
  thumbnail_url TEXT,
  caption TEXT,
  photographer_name TEXT,
  taken_at TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_galleries_event ON galleries(event_id);
CREATE INDEX IF NOT EXISTS idx_galleries_published ON galleries(is_published);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_gallery ON gallery_photos(gallery_id);
```

### 2.2 External API Integration Services

**Create Edge Function Utilities:**

```typescript
// supabase/functions/_shared/pixieset.ts
export class PixiesetClient {
  private apiKey: string;

  constructor() {
    this.apiKey = Deno.env.get('PIXIESET_API_KEY') || '';
  }

  async getCollection(collectionId: string) {
    // Fetch collection metadata from Pixieset API
  }

  async getPhotos(collectionId: string) {
    // Fetch photos from collection
  }

  async validateCollectionId(collectionId: string): Promise<boolean> {
    // Verify collection exists and is accessible
  }
}

// supabase/functions/_shared/googleDrive.ts
export class GoogleDriveClient {
  async getFolder(folderId: string) {
    // Fetch folder metadata
  }

  async listPhotos(folderId: string) {
    // List photos in folder
  }

  async validateFolderId(folderId: string): Promise<boolean> {
    // Verify folder exists and has proper sharing settings
  }
}
```

### 2.3 Gallery Edge Functions

1. **`list-galleries`** (✅ Exists, enhance)
   - GET /list-galleries?eventId=...
   - Return all galleries for an event
   - Include photo count

2. **`create-gallery`** (✅ Exists, enhance)
   - POST /create-gallery
   - Support all 3 types: pixieset, google_drive, internal
   - Validate external IDs
   - Fetch initial metadata

3. **`update-gallery`** (❌ NEW)
   - PATCH /update-gallery
   - Update metadata only
   - Re-sync external data if needed

4. **`delete-gallery`** (❌ NEW)
   - DELETE /delete-gallery
   - Only delete metadata link, not external data

5. **`upload-photo`** (✅ Exists, enhance)
   - POST /upload-photo
   - For internal galleries only
   - Upload to Supabase Storage
   - Generate thumbnails

6. **`sync-external-gallery`** (❌ NEW)
   - POST /sync-external-gallery
   - Refresh metadata from Pixieset/Google Drive
   - Update photo count, thumbnail

### 2.4 Frontend Components for Galleries

```
issb-portal/src/
├── pages/
│   ├── GalleriesPage.tsx (❌ NEW)
│   ├── GalleryDetailPage.tsx (❌ NEW)
│   └── AdminGalleryManagement.tsx (✅ Exists, complete TODOs)
├── components/galleries/
│   ├── GalleryGrid.tsx (❌ NEW)
│   ├── GalleryCard.tsx (❌ NEW)
│   ├── PhotoLightbox.tsx (❌ NEW)
│   ├── ExternalGalleryEmbed.tsx (❌ NEW - Pixieset/Google Drive)
│   └── PhotoUploadForm.tsx (❌ NEW)
```

---

## Phase 3: Security & Validation (Week 5)

### 3.1 Enhanced RLS Policies

```sql
-- Events RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by members if published"
  ON events FOR SELECT
  TO authenticated
  USING (status = 'published' OR
         auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'board')));

CREATE POLICY "Only admins and board can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'board'))
  );

CREATE POLICY "Creators and admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Galleries RLS
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published galleries viewable by all members"
  ON galleries FOR SELECT
  TO authenticated
  USING (is_published = true OR
         auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'board')));

CREATE POLICY "Only admins and board can create galleries"
  ON galleries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'board'))
  );
```

### 3.2 Input Validation (Zod Schemas)

```typescript
// supabase/functions/_shared/validation.ts
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  event_date: z.string().datetime(),
  location: z.string().min(3).max(500),
  capacity: z.number().int().positive().optional(),
  registration_required: z.boolean().default(false),
  featured_image_url: z.string().url().optional(),
  tags: z.array(z.string()).max(10).optional(),
  status: z.enum(['draft', 'published', 'cancelled'])
});

export const createGallerySchema = z.object({
  event_id: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  gallery_type: z.enum(['pixieset', 'google_drive', 'internal']),
  external_id: z.string().optional(),
  is_published: z.boolean().default(false)
});
```

### 3.3 Rate Limiting

```typescript
// supabase/functions/_shared/rate-limiter.ts (✅ Exists, apply to new endpoints)
import { RateLimiter } from './rate-limiter.ts';

const limiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000 // 100 requests per minute
});
```

---

## Phase 4: Payment Integration (Week 6-7)

### 4.1 Stripe Integration for Events

**Edge Functions:**

1. **`create-event-payment`** (❌ NEW)
   - Create payment intent for paid events
   - Handle event registration fees

2. **`stripe-event-webhook`** (❌ NEW)
   - Handle payment confirmations
   - Auto-register user after payment

### 4.2 Database Schema

```sql
CREATE TABLE IF NOT EXISTS event_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT UNIQUE,
  status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Phase 5: Mobile Optimization & PWA (Week 8)

### 5.1 Progressive Web App Setup

```json
// issb-portal/public/manifest.json
{
  "name": "ISSB Membership Portal",
  "short_name": "ISSB",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 5.2 Service Worker

```typescript
// issb-portal/public/service-worker.js
// Cache static assets
// Offline fallback pages
// Background sync for form submissions
```

---

## Phase 6: Testing & Quality Assurance (Week 9-10)

### 6.1 Automated Testing

```typescript
// issb-portal/src/__tests__/
├── events/
│   ├── eventRegistration.test.tsx
│   ├── eventsList.test.tsx
│   └── eventApi.test.ts
├── galleries/
│   ├── galleryGrid.test.tsx
│   └── galleryApi.test.ts
└── integration/
    └── eventGalleryFlow.test.ts
```

### 6.2 End-to-End Tests

```typescript
// e2e/events.spec.ts
test('User can register for an event', async () => {
  // Login
  // Navigate to events
  // Find event
  // Click register
  // Verify registration
});
```

---

## Phase 7: Analytics & Monitoring (Week 11)

### 7.1 Custom Analytics Dashboard

```sql
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Track: page views, event registrations, gallery views, etc.
```

### 7.2 Edge Function

```typescript
// track-analytics
export const handler = async (req: Request) => {
  // Log analytics event
  // Update aggregated metrics
};
```

---

## Phase 8: Additional Features (Week 12+)

### 8.1 Email Notifications (Resend or SendGrid)

- Event registration confirmations
- Event reminders (1 day before)
- Gallery upload notifications
- Admin notifications for new registrations

### 8.2 Prayer Times Integration

```typescript
// supabase/functions/get-prayer-times/index.ts
// Integrate with Aladhan API or similar
```

### 8.3 Announcements System Enhancement

- Rich text editor
- Schedule announcements
- Target specific user groups
- Push notifications

### 8.4 Donation Portal

- Stripe integration
- Recurring donations
- Donation campaigns
- Tax receipt generation

---

## Success Metrics

### Key Performance Indicators (KPIs):

1. **User Engagement**
   - Monthly active users > 70% of total members
   - Average session duration > 5 minutes
   - Event registration rate > 40% of published events

2. **Technical Performance**
   - Page load time < 2 seconds
   - API response time < 500ms (p95)
   - Uptime > 99.9%

3. **Feature Adoption**
   - 80%+ events use gallery integration
   - 60%+ members use mobile app
   - 90%+ event registrations done online

4. **Quality**
   - Test coverage > 80%
   - Zero critical security vulnerabilities
   - < 5 bugs per release

---

## Implementation Priority

**Must Have (Phase 1-3):**
1. ✅ Complete Event Management
2. ✅ Gallery Integration
3. ✅ Security & Validation

**Should Have (Phase 4-5):**
4. ⚠️ Payment Integration
5. ⚠️ PWA/Mobile Optimization

**Nice to Have (Phase 6-8):**
6. 🔵 Comprehensive Testing
7. 🔵 Analytics Dashboard
8. 🔵 Email Notifications
9. 🔵 Prayer Times
10. 🔵 Advanced Features

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Events | 2 weeks | 🟡 40% Complete |
| Phase 2: Galleries | 2 weeks | 🟡 20% Complete |
| Phase 3: Security | 1 week | 🟢 60% Complete |
| Phase 4: Payments | 2 weeks | 🔴 0% Complete |
| Phase 5: Mobile/PWA | 1 week | 🔴 0% Complete |
| Phase 6: Testing | 2 weeks | 🔴 5% Complete |
| Phase 7: Analytics | 1 week | 🔴 0% Complete |
| Phase 8: Additional | 3+ weeks | 🔴 0% Complete |
| **Total** | **14+ weeks** | **~35% Complete** |

**Target Completion:** 9-10 weeks from now (Early February 2026)

---

## Next Immediate Steps

1. ✅ Complete Event Registration System (1-2 days)
2. ✅ Implement Gallery TODOs in AdminGalleryManagement (1 day)
3. ✅ Create Gallery Frontend Components (2-3 days)
4. ✅ Add Pixieset/Google Drive Integration (2-3 days)
5. ✅ Deploy and Test (1 day)

**Let's start building! 🚀**
