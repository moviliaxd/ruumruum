'use client';

/**
 * useTrips — reemplaza base44.entities.Trip.*
 * Con tiempo real: conductor ve viajes nuevos al instante
 */

import { useEffect, useState } from 'react';
import { supabase, Trip } from '@/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';

export function useTrips() {
  const { profile } = useAuth();
  const [trips, setTrips]     = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) setError(error.message);
    else setTrips(data as Trip[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!profile) return;

    fetchTrips();

    // Tiempo real — cualquier cambio en trips se refleja al instante
    const channel = supabase
      .channel('trips-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTrips(prev => [payload.new as Trip, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTrips(prev => prev.map(t => t.id === payload.new.id ? payload.new as Trip : t));
          } else if (payload.eventType === 'DELETE') {
            setTrips(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const updateTripStatus = async (tripId: string, status: Trip['status'], extra?: Partial<Trip>) => {
    const { error } = await supabase
      .from('trips')
      .update({ status, ...extra })
      .eq('id', tripId);
    if (error) throw new Error(error.message);
  };

  const createTrip = async (data: Omit<Trip, 'id' | 'created_at'>) => {
    const { data: trip, error } = await supabase
      .from('trips')
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return trip as Trip;
  };

  return { trips, loading, error, refetch: fetchTrips, updateTripStatus, createTrip };
}
