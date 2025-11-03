import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-events');
      
      if (error) throw error;
      
      if (data?.data?.events) {
        setEvents(data.data.events);
      }
    } catch (error: any) {
      console.error('Error loading events:', error);
      setMessage({ type: 'error', text: 'Failed to load events' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'workshop': 'bg-blue-100 text-blue-700',
      'social': 'bg-purple-100 text-purple-700',
      'meeting': 'bg-green-100 text-green-700',
      'volunteer': 'bg-orange-100 text-orange-700',
      'fundraiser': 'bg-pink-100 text-pink-700',
      'other': 'bg-gray-100 text-gray-700'
    };
    return colors[type] || colors['other'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
          <p className="text-gray-600 mt-1">Join our community events and activities</p>
        </div>
      </div>

      {events.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Events</h3>
          <p className="text-gray-600">Check back soon for new events and activities!</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900 flex-1">{event.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEventTypeColor(event.event_type)}`}>
                    {event.event_type}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    <span className="font-medium">{formatDate(event.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Users className="w-4 h-4 text-primary-600" />
                    <span>{event.current_registrations} / {event.capacity} registered</span>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  disabled={event.current_registrations >= event.capacity}
                >
                  {event.current_registrations >= event.capacity ? 'Event Full' : 'Register for Event'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
