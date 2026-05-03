'use client';

import { useState } from 'react';
import { useAuth } from '@/src/lib/AuthContext';
import Link from 'next/link';

export default function RegistroPage() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '', rol: 'cliente' as 'cliente' | 'conductor' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmar) { setError('Las contraseñas no coinciden'); return; }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.nombre, form.rol);
    if (error) setError(error);
    else setSuccess(true);
    setLoading(false);
  };

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#151515', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: '#FFC400', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#151515" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 12 }}>¡Cuenta creada!</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          Revisa tu correo <strong style={{ color: '#FFC400' }}>{form.email}</strong> para confirmar tu cuenta y luego inicia sesión.
        </p>
        <Link href="/login" style={{ background: '#FFC400', color: '#151515', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, padding: '12px 32px', textDecoration: 'none', display: 'inline-block' }}>
          Ir al login
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#151515', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, background: '#FFC400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 16, color: '#151515', letterSpacing: -1 }}>RR</div>
            <div>
              <div style={{ color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: 1 }}>Ruum Ruum</div>
              <div style={{ color: '#FFC400', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>by MoviliaX</div>
            </div>
          </div>
        </div>

        <div style={{ background: '#1E1E1E', border: '0.5px solid rgba(255,255,255,0.1)', padding: '36px 32px' }}>
          <h1 style={{ color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Crear cuenta</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>Únete a Ruum Ruum</p>

          {/* Selector de rol */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
            {(['cliente', 'conductor'] as const).map(rol => (
              <button key={rol} type="button" onClick={() => setForm(f => ({ ...f, rol }))}
                style={{ padding: '12px', border: `1.5px solid ${form.rol === rol ? '#FFC400' : 'rgba(255,255,255,0.1)'}`, background: form.rol === rol ? 'rgba(255,196,0,0.1)' : 'transparent', color: form.rol === rol ? '#FFC400' : 'rgba(255,255,255,0.4)', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>
                {rol === 'cliente' ? '👤 Cliente' : '🚗 Conductor'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {[
              { label: 'Nombre completo', key: 'nombre', type: 'text', placeholder: 'Tu nombre' },
              { label: 'Correo electrónico', key: 'email', type: 'email', placeholder: 'tu@correo.com' },
              { label: 'Contraseña', key: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'Confirmar contraseña', key: 'confirmar', type: 'password', placeholder: '••••••••' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{label}</label>
                <input type={type} placeholder={placeholder} required
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13, padding: '10px 14px', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', background: loading ? '#9ca3af' : '#FFC400', color: '#151515', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, padding: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
