# Frontend Integration Quick Start

## Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lsyimggqennkyxgajzvn.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY_HERE'; // Use get_all_secrets tool

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## API Usage Examples

### List Events
```typescript
const { data, error } = await supabase.functions.invoke('list-events');

if (error) {
  console.error('Error fetching events:', error);
  return;
}

const events = data.data.events;
// events is an array of event objects with:
// - id, title, description, event_type, status
// - start_date, end_date, location, capacity
// - current_registrations, is_published
```

### List Badges
```typescript
const { data, error } = await supabase.functions.invoke('list-badges');

if (error) {
  console.error('Error fetching badges:', error);
  return;
}

const badges = data.data.badges;
// badges array includes:
// - id, name, description, icon_url
// - criteria (JSONB), points, is_active
```

### Get Member Badges
```typescript
// Requires authentication
const { data, error } = await supabase.functions.invoke('get-member-badges');

if (error) {
  console.error('Error fetching member badges:', error);
  return;
}

const memberBadges = data.data.member_badges;
// Each item includes:
// - member_id, badge_id, earned_at, evidence
// - badge (nested object with full badge details)
```

### List Contests
```typescript
const { data, error } = await supabase.functions.invoke('list-contests');

if (error) {
  console.error('Error fetching contests:', error);
  return;
}

const contests = data.data.contests;
// contests array includes:
// - id, title, description, rules
// - prize_description, sponsor_name, sponsor_logo_url
// - start_date, end_date, max_submissions
```

### List Photo Galleries
```typescript
const { data, error } = await supabase.functions.invoke('list-galleries');

if (error) {
  console.error('Error fetching galleries:', error);
  return;
}

const galleries = data.data.galleries;
// galleries array includes:
// - id, title, description, cover_image_url
// - event_id, is_published, created_at
```

### Create Event (Admin Only)
```typescript
const eventData = {
  title: 'New Event',
  description: 'Event description here',
  event_type: 'workshop', // meeting, workshop, social, fundraiser, volunteer, other
  status: 'published', // draft, published, cancelled, completed
  start_date: '2025-12-01T18:00:00Z',
  end_date: '2025-12-01T21:00:00Z',
  location: 'Main Hall',
  capacity: 100,
  is_published: true
};

const { data, error } = await supabase.functions.invoke('create-event', {
  body: eventData
});

if (error) {
  console.error('Error creating event:', error);
  return;
}

const newEvent = data.data.event;
```

## Component Examples

### Events List Component
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location: string;
  capacity: number;
  current_registrations: number;
}

export const EventsList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('list-events');
    
    if (!error && data?.data?.events) {
      setEvents(data.data.events);
    }
    setLoading(false);
  };

  if (loading) {
    return <div>Loading events...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Upcoming Events</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {events.map((event) => (
          <Card key={event.id} className="p-6">
            <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
            <p className="text-gray-600 mb-4">{event.description}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(event.start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{event.current_registrations} / {event.capacity} registered</span>
              </div>
            </div>

            <Button className="w-full mt-4">Register for Event</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

### Member Achievements Component
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Award, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MemberBadge {
  id: string;
  earned_at: string;
  badge: {
    name: string;
    description: string;
    icon_url: string | null;
    points: number;
  };
}

export const MemberAchievements = () => {
  const [badges, setBadges] = useState<MemberBadge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('get-member-badges');
    
    if (!error && data?.data?.member_badges) {
      const memberBadges = data.data.member_badges;
      setBadges(memberBadges);
      
      const points = memberBadges.reduce(
        (sum: number, mb: MemberBadge) => sum + (mb.badge?.points || 0),
        0
      );
      setTotalPoints(points);
    }
    setLoading(false);
  };

  if (loading) {
    return <div>Loading achievements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Achievements</h2>
        <div className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <span>{totalPoints} Points</span>
        </div>
      </div>

      {badges.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No badges earned yet. Start participating to earn achievements!</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {badges.map((mb) => (
            <Card key={mb.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{mb.badge.name}</h3>
                  <p className="text-sm text-gray-600">{mb.badge.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                      {mb.badge.points} points
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(mb.earned_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Active Contests Component
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Contest {
  id: string;
  title: string;
  description: string;
  prize_description: string;
  sponsor_name: string;
  start_date: string;
  end_date: string;
  max_submissions: number;
}

export const ActiveContests = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('list-contests');
    
    if (!error && data?.data?.contests) {
      setContests(data.data.contests);
    }
    setLoading(false);
  };

  const isActive = (contest: Contest) => {
    const now = new Date();
    const start = new Date(contest.start_date);
    const end = new Date(contest.end_date);
    return now >= start && now <= end;
  };

  if (loading) {
    return <div>Loading contests...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Active Contests</h2>
      <div className="space-y-4">
        {contests.map((contest) => (
          <Card key={contest.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">{contest.title}</h3>
                {contest.sponsor_name && (
                  <p className="text-sm text-gray-600">Sponsored by {contest.sponsor_name}</p>
                )}
              </div>
              {isActive(contest) && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  Active
                </span>
              )}
            </div>

            <p className="text-gray-700 mb-4">{contest.description}</p>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span>{contest.prize_description}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Ends {new Date(contest.end_date).toLocaleDateString()}</span>
              </div>
            </div>

            <Button disabled={!isActive(contest)}>
              {isActive(contest) ? 'Submit Entry' : 'Contest Closed'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

## Integration into Existing Pages

### MembershipDashboardPage.tsx
```typescript
import { EventsList } from '@/components/events/EventsList';
import { MemberAchievements } from '@/components/achievements/MemberAchievements';
import { ActiveContests } from '@/components/contests/ActiveContests';

// Add to tab state
const [activeTab, setActiveTab] = useState<'progress' | 'opportunities' | 'assignments' | 'log' | 'events' | 'achievements' | 'contests'>('progress');

// Add new tabs to TabsList
<TabsTrigger value="events">Events</TabsTrigger>
<TabsTrigger value="achievements">My Achievements</TabsTrigger>
<TabsTrigger value="contests">Contests</TabsTrigger>

// Add TabsContent sections
<TabsContent value="events">
  <EventsList />
</TabsContent>

<TabsContent value="achievements">
  <MemberAchievements />
</TabsContent>

<TabsContent value="contests">
  <ActiveContests />
</TabsContent>
```

## Error Handling
```typescript
const { data, error } = await supabase.functions.invoke('function-name');

if (error) {
  // Handle error
  console.error('Function error:', error);
  // Show user-friendly message
  toast.error('Failed to load data. Please try again.');
  return;
}

if (!data || !data.data) {
  // Handle unexpected response
  console.error('Unexpected response format');
  return;
}

// Use data
const results = data.data;
```

## Type Definitions

### src/types/events.ts
```typescript
export interface Event {
  id: string;
  title: string;
  description: string;
  event_type: 'meeting' | 'workshop' | 'social' | 'fundraiser' | 'volunteer' | 'other';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  location: string;
  is_virtual: boolean;
  virtual_link: string | null;
  capacity: number;
  current_registrations: number;
  allowed_tiers: string[];
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_published: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  criteria: {
    type: string;
    threshold: number;
  };
  points: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface MemberBadge {
  id: string;
  member_id: string;
  badge_id: string;
  earned_at: string;
  evidence: any;
  badge: Badge;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  rules: string;
  prize_description: string;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  sponsor_contact: any;
  entry_requirements: string;
  max_submissions: number;
  start_date: string;
  end_date: string;
  winner_selected_at: string | null;
  created_by: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhotoGallery {
  id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  event_id: string | null;
  created_by: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
```

## Ready to Go!

All backend services are deployed and tested. Simply:
1. Copy the Supabase client setup
2. Create the components using the examples above
3. Integrate into existing dashboard pages
4. Test with your authenticated user

The backend will handle all data operations, authentication, and authorization automatically.
