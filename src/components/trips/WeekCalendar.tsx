'use client';

import { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trip } from '@/lib/supabase';

interface Props {
  trips: Trip[];
  selectedDate: Date | null;
  onDaySelect: (date: Date) => void;
}

export default function WeekCalendar({ trips = [], selectedDate, onDaySelect }: Props) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getTripsForDay = (day: Date) =>
    trips.filter(t => t.trip_date && isSameDay(new Date(t.trip_date), day));

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => setWeekStart(addDays(weekStart, -7))}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', padding: '4px 8px' }}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111', fontFamily: 'Montserrat, sans-serif' }}>
          {format(weekStart, 'MMMM yyyy', { locale: es })}
        </span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', padding: '4px 8px' }}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {days.map((day, i) => {
          const dayTrips   = getTripsForDay(day);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isToday    = isSameDay(day, new Date());

          return (
            <button key={i} onClick={() => onDaySelect(day)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 4px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: isSelected ? '#151515' : isToday ? '#fef9c3' : '#fff',
                transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 500, color: isSelected ? 'rgba(255,255,255,0.6)' : '#9ca3af', marginBottom: 4 }}>
                {format(day, 'EEE', { locale: es })}
              </span>
              <span style={{ fontSize: 18, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: isSelected ? '#FFC400' : '#111' }}>
                {format(day, 'd')}
              </span>
              {dayTrips.length > 0 && (
                <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                  {dayTrips.slice(0, 3).map((_, j) => (
                    <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.5)' : '#FFC400' }}/>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
