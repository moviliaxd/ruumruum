'use client';

import { useState, useEffect, useCallback } from 'react';
import { isSameDay } from 'date-fns';
import { supabase, Trip } from '@/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';
import TripCard from '@/src/components/trips/TripCard';
import WeekCalendar from '@/src/components/trips/WeekCalendar';
import TripFlowManager from '@/src/components/trips/TripFlowManager';
import RoleGate from '@/src/components/RoleGate';

const ACTIVE_STATUSES = ['accepted', 'in_progress', 'pickup_arrived', 'vehicle_picked', 'delivering'];

type TabKey = 'solicitados' | 'aceptados' | 'calendario';

export default function ViajesPage() {
  return (
    <RoleGate allowed={['conductor']}>
      <ViajesContent />
    </RoleGate>
  );
}

function ViajesContent() {
  const { profile } = useAuth();
  const [trips, setTrips]           = useState<Trip[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<TabKey>('solicitados');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [flowTrip, setFlowTrip]     = useState<Trip | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('trips')
      .select('*')
      .order('trip_date', { ascending: false })
      .limit(200);
    setTrips((data ?? []) as Trip[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!profile) return;
    fetchTrips();

    // Tiempo real
    const channel = supabase
      .channel('viajes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        fetchTrips();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, fetchTrips]);

  const requested = trips.filter(t => t.status === 'requested');
  const accepted  = trips.filter(t => ACTIVE_STATUSES.includes(t.status));
  const scheduled = selectedDate
    ? trips.filter(t => t.trip_date && isSameDay(new Date(t.trip_date), selectedDate))
    : accepted;

  const handleTripClick = (trip: Trip) => {
    if (ACTIVE_STATUSES.includes(trip.status)) setFlowTrip(trip);
    else setSelectedTrip(trip);
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'solicitados', label: 'Solicitados', count: requested.length },
    { key: 'aceptados',   label: 'Aceptados',   count: accepted.length },
    { key: 'calendario',  label: 'Calendario' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F5' }}>

      {/* Header */}
      <div style={{ background: '#151515', padding: '16px 20px' }}>
        <div style={{ fontSize: 20, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: '#fff' }}>Viajes</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Gestiona tus traslados</div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', padding: '0 20px' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 16px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid #FFC400' : '2px solid transparent',
              color: activeTab === tab.key ? '#151515' : '#6b7280',
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontFamily: 'Montserrat, sans-serif',
            }}>
            {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* Solicitados */}
        {activeTab === 'solicitados' && (
          loading ? <LoadingSkeleton /> :
          requested.length === 0 ? <EmptyState text="Sin viajes solicitados" /> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requested.map((trip, i) => <TripCard key={trip.id} trip={trip} index={i} onClick={handleTripClick}/>)}
          </div>
        )}

        {/* Aceptados */}
        {activeTab === 'aceptados' && (
          loading ? <LoadingSkeleton /> :
          accepted.length === 0 ? <EmptyState text="Sin viajes aceptados" /> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accepted.map((trip, i) => <TripCard key={trip.id} trip={trip} index={i} onClick={handleTripClick}/>)}
          </div>
        )}

        {/* Calendario */}
        {activeTab === 'calendario' && (
          <>
            <WeekCalendar trips={trips} selectedDate={selectedDate} onDaySelect={setSelectedDate}/>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {scheduled.length === 0
                ? <EmptyState text="Sin viajes para esta fecha"/>
                : scheduled.map((trip, i) => <TripCard key={trip.id} trip={trip} index={i} onClick={handleTripClick}/>)
              }
            </div>
          </>
        )}
      </div>

      {/* Trip detail modal (solo info) */}
      {selectedTrip && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setSelectedTrip(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 520, padding: '24px 20px 32px' }}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Detalle del viaje</div>
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Recogida</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedTrip.pickup_location}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 10, marginBottom: 4 }}>Entrega</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedTrip.dropoff_location}</div>
            </div>
            {selectedTrip.vehicle_brand && (
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                🚗 {selectedTrip.vehicle_brand} {selectedTrip.vehicle_model} {selectedTrip.vehicle_plates ? `· ${selectedTrip.vehicle_plates}` : ''}
              </div>
            )}
            {selectedTrip.notes && (
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>📝 {selectedTrip.notes}</div>
            )}
            <button onClick={() => setSelectedTrip(null)} style={{ width: '100%', background: '#FFC400', border: 'none', borderRadius: 10, padding: 12, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Flow manager */}
      <TripFlowManager
        trip={flowTrip}
        open={!!flowTrip}
        onClose={() => setFlowTrip(null)}
        onTripUpdated={fetchTrips}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 120, background: '#e5e7eb', borderRadius: 16, animation: 'pulse 1.5s infinite' }}/>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{ width: 56, height: 56, background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>🚗</div>
      <p style={{ fontSize: 14, color: '#9ca3af' }}>{text}</p>
    </div>
  );
}
