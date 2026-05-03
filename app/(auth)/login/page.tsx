'use client';

import { useState } from 'react';
import { useAuth } from '@/src/lib/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#151515',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, background: '#FFC400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 18, color: '#151515', letterSpacing: -1 }}>
              RR
            </div>
            <div>
              <div style={{ color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, lineHeight: 1 }}>Ruum Ruum</div>
              <div style={{ color: '#FFC400', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>by MoviliaX</div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#1E1E1E', border: '0.5px solid rgba(255,255,255,0.1)', padding: '36px 32px' }}>
          <h1 style={{ color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
            Iniciar sesión
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 28 }}>
            Accede a tu cuenta Ruum Ruum
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                Correo electrónico
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com" required
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                Contraseña
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13, padding: '10px 14px', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{ width: '100%', background: loading ? '#9ca3af' : '#FFC400', color: '#151515', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, padding: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', justifyContent: 'center', gap: 24 }}>
          <Link href="/registro" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>
            ¿No tienes cuenta? Regístrate
          </Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, textDecoration: 'none' }}>
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
