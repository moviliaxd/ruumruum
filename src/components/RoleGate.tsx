'use client';

import { ReactNode, useEffect } from 'react';
import { Role } from '@/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';

const HOME_BY_ROLE: Record<Role, string> = {
  admin: '/admin',
  conductor: '/conductor',
  cliente: '/cliente',
};

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#151515', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#FFC400', fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 16 }}>Cargando...</div>
    </div>
  );
}

export default function RoleGate({ allowed, children }: { allowed: Role[]; children: ReactNode }) {
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      window.location.href = '/login';
      return;
    }
    if (!allowed.includes(profile.role)) {
      window.location.href = HOME_BY_ROLE[profile.role] ?? '/';
    }
  }, [allowed, loading, profile]);

  if (loading || !profile || !allowed.includes(profile.role)) return <LoadingScreen />;

  return <>{children}</>;
}
