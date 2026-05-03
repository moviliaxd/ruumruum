'use client';
import { useAuth } from '@/src/lib/AuthContext';

export default function ConductorPage() {
  const { profile, loading, signOut } = useAuth();

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#151515', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#FFC400', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:16 }}>Cargando...</div>
    </div>
  );

  if (!profile) return (
    <div style={{ minHeight:'100vh', background:'#151515', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:14, marginBottom:16 }}>No hay sesión activa</div>
        <a href="/login" style={{ color:'#FFC400', fontSize:14 }}>Ir al login</a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#F8F8F5' }}>
      <div style={{ background:'#151515', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background:'#FFC400', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#151515' }}>RR</div>
          <div>
            <div style={{ color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:15 }}>Panel conductor</div>
            <div style={{ color:'#FFC400', fontSize:10, letterSpacing:2 }}>Ruum Ruum</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>Hola, {profile.full_name?.split(' ')[0]}</span>
          <button onClick={signOut} style={{ background:'transparent', border:'0.5px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.5)', fontSize:12, padding:'6px 14px', cursor:'pointer' }}>Salir</button>
        </div>
      </div>
      <div style={{ padding:32, textAlign:'center', marginTop:60 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🚗</div>
        <h2 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:24, color:'#151515', marginBottom:8 }}>
          ¡Bienvenido, {profile.full_name?.split(' ')[0]}!
        </h2>
        <p style={{ color:'#6b7280', fontSize:15 }}>Panel del conductor — aquí van tus viajes, ganancias y documentos.</p>
        <p style={{ color:'#9ca3af', fontSize:13, marginTop:8 }}>En construcción — próxima actualización.</p>
        <div style={{ marginTop:32, display:'inline-flex', gap:12 }}>
          <a href="/dashboard" style={{ background:'#151515', color:'#FFC400', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, padding:'12px 24px', textDecoration:'none' }}>
            Ver tablero maestro
          </a>
        </div>
      </div>
    </div>
  );
}
