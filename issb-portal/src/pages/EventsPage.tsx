import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Plus, Clock, Moon, Sun, Sunset, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Event, EventRegistration } from '@/types';

interface PrayerTime {
  name: string;
  time: string;
  icon: any;
  color: string;
}

export function EventsPage() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<EventRegistration[]>([]);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [prayerTimesLoading, setPrayerTimesLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
    loadPrayerTimes();
    if (user) {
      loadMyRegistrations();
    }
  }, [user]);

  async function loadPrayerTimes() {
    try {
      // Sarasota, FL coordinates
      const latitude = 27.3364;
      const longitude = -82.5307;
      
      // Get current date
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      
      // Fetch from Aladhan API
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=2`
      );
      
      if (response.ok) {
        const data = await response.json();
        const timings = data.data.timings;
        
        setPrayerTimes([
          { name: 'Fajr', time: convertTo12Hour(timings.Fajr), icon: Moon, color: 'indigo' },
          { name: 'Dhuhr', time: convertTo12Hour(timings.Dhuhr), icon: Sun, color: 'yellow' },
          { name: 'Asr', time: convertTo12Hour(timings.Asr), icon: Sun, color: 'orange' },
          { name: 'Maghrib', time: convertTo12Hour(timings.Maghrib), icon: Sunset, color: 'red' },
          { name: 'Isha', time: convertTo12Hour(timings.Isha), icon: Moon, color: 'purple' },
        ]);
      } else {
        // Fallback to default times if API fails
        setDefaultPrayerTimes();
      }
    } catch (error) {
      console.error('Error loading prayer times:', error);
      // Fallback to default times
      setDefaultPrayerTimes();
    } finally {
      setPrayerTimesLoading(false);
    }
  }

  function setDefaultPrayerTimes() {
    setPrayerTimes([
      { name: 'Fajr', time: '5:45 AM', icon: Moon, color: 'indigo' },
      { name: 'Dhuhr', time: '1:15 PM', icon: Sun, color: 'yellow' },
      { name: 'Asr', time: '4:30 PM', icon: Sun, color: 'orange' },
      { name: 'Maghrib', time: '7:05 PM', icon: Sunset, color: 'red' },
      { name: 'Isha', time: '8:25 PM', icon: Moon, color: 'purple' },
    ]);
  }

  function convertTo12Hour(time24: string): string {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Events & Prayer Times</h1>
          <p className="text-gray-600 mt-2">Daily prayers, Islamic programs, and community events</p>
        </div>
        {profile && ['admin', 'board'].includes(profile.role) && (
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </button>
        )}
      </div>

      {/* Prayer Times Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Daily Prayer Times</h2>
            <p className="text-sm text-green-100 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="text-sm text-green-100">Sarasota, FL</div>
        </div>
        
        {prayerTimesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading prayer times...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {prayerTimes.map((prayer) => {
              const Icon = prayer.icon;
              return (
                <div key={prayer.name} className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold text-lg">{prayer.name}</div>
                  <div className="text-2xl font-bold mt-1">{prayer.time}</div>
                </div>
              );
            })}
          </div>
        )}
        
        <p className="text-sm text-green-100 mt-4 text-center">
          Jumu'ah (Friday Prayer): 1:30 PM | Iqamah times are approximately 15 minutes after Adhan
        </p>
      </div>

      {/* Special Islamic Events Highlight */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Islamic Programs & Activities</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
            <h3 className="font-semibold text-green-900 mb-1">Daily Prayers</h3>
            <p className="text-sm text-gray-600">All five daily prayers in congregation</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-600">
            <h3 className="font-semibold text-emerald-900 mb-1">Jumu'ah</h3>
            <p className="text-sm text-gray-600">Friday congregational prayer and khutbah</p>
          </div>
          <div className="p-4 bg-teal-50 rounded-lg border-l-4 border-teal-600">
            <h3 className="font-semibold text-teal-900 mb-1">Quran Study</h3>
            <p className="text-sm text-gray-600">Weekly Quran recitation and tafsir circles</p>
          </div>
          <div className="p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-600">
            <h3 className="font-semibold text-cyan-900 mb-1">Islamic School</h3>
            <p className="text-sm text-gray-600">Weekend Islamic education for children</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
            <h3 className="font-semibold text-blue-900 mb-1">Youth Programs</h3>
            <p className="text-sm text-gray-600">Activities and mentorship for young Muslims</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-600">
            <h3 className="font-semibold text-indigo-900 mb-1">Family Events</h3>
            <p className="text-sm text-gray-600">Community gatherings and celebrations</p>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Upcoming Events</h2>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No upcoming events</h3>
            <p className="text-gray-600">Check back later for new events and activities</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-green-500 hover:shadow-lg transition">
                {event.image_url && (
                  <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium capitalize">
                      {event.event_type}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-green-600" />
                      {new Date(event.start_date).toLocaleString()}
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-green-600" />
                        {event.location}
                      </div>
                    )}
                    {event.capacity && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-green-600" />
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
                      <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
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

      {/* Important Dates Reminder */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border-l-4 border-amber-500">
        <h3 className="font-semibold text-lg text-gray-900 mb-2">Important Islamic Dates</h3>
        <p className="text-gray-700 text-sm">
          Stay tuned for upcoming Ramadan programs, Eid celebrations, and other special Islamic occasions.
          Follow our announcements for detailed schedules and special events.
        </p>
      </div>
    </div>
  );
}
