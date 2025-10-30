import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Event, EventRegistration } from '@/types';

export function EventsPage() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
    if (user) {
      loadMyRegistrations();
    }
  }, [user]);

  async function loadEvents() {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('start_date', { ascending: true });

      if (data) setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyRegistrations() {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('user_id', user.id);

      if (data) setMyRegistrations(data);
    } catch (error) {
      console.error('Error loading registrations:', error);
    }
  }

  const isRegistered = (eventId: string) => {
    return myRegistrations.some(r => r.event_id === eventId && r.status !== 'cancelled');
  };

  if (loading) {
    return <div className="text-center py-12">Loading events...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-2">Upcoming community events and activities</p>
        </div>
        {profile && ['admin', 'board'].includes(profile.role) && (
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming events</h3>
          <p className="text-gray-600">Check back later for new events and activities</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              {event.image_url && (
                <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium capitalize">
                    {event.event_type}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(event.start_date).toLocaleString()}
                  </div>
                  {event.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                  )}
                  {event.capacity && (
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {event.current_registrations} / {event.capacity} registered
                    </div>
                  )}
                </div>

                {user ? (
                  isRegistered(event.id) ? (
                    <div className="w-full px-4 py-2 bg-green-100 text-green-800 rounded-md text-center font-medium">
                      Registered
                    </div>
                  ) : (
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                      Register
                    </button>
                  )
                ) : (
                  <button className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md font-medium cursor-not-allowed">
                    Sign in to Register
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
