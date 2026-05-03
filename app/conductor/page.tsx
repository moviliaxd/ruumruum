'use client';
import { useAuth } from '@/src/lib/AuthContext';
import Link from 'next/link';

export default function ConductorPage() {
  const { profile, loading, signOut } = useAuth();

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#151515', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#FFC400', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:16 }}>Cargando...</div>
    </div>
  );

  if (!profile) return (
    <div style={{ minHeight:'100vh', background:'#151515', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <a href="/login" style={{ color:'#FFC400', fontSize:14 }}>Ir al login</a>
    </div>
  );

  const menuItems = [
    { href:'/conductor/viajes',    icon:'🚗', label:'Mis viajes',   desc:'Gestiona tus traslados' },
    { href:'/dashboard',           icon:'📊', label:'Tablero',      desc:'Vista general operativa' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#F8F8F5' }}>
      <div style={{ background:'#151515', padding:'20px 20px 32px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, background:'#FFC400', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#151515' }}>RR</div>
            <div>
              <div style={{ color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:15 }}>Ruum Ruum</div>
              <div style={{ color:'#FFC400', fontSize:10, letterSpacing:2 }}>CONDUCTOR</div>
            </div>
          </div>
          <button onClick={signOut} style={{ background:'transparent', border:'0.5px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.5)', fontSize:12, padding:'6px 14px', cursor:'pointer' }}>Salir</button>
        </div>
        <div style={{ fontSize:22, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'#fff' }}>
          ¡Hola, {profile.full_name?.split(' ')[0]}! 👋
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:4 }}>¿Listo para tu próximo traslado?</div>
      </div>

      <div style={{ padding:'20px', marginTop:-16 }}>
        <Link href="/conductor/viajes"
          style={{ display:'block', background:'#FFC400', borderRadius:16, padding:'20px', marginBottom:12, textDecoration:'none', boxShadow:'0 4px 20px rgba(255,196,0,0.3)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:18, color:'#151515' }}>Ver mis viajes</div>
              <div style={{ fontSize:13, color:'rgba(21,21,21,0.6)', marginTop:2 }}>Conductores certificados</div>
            </div>
            <div style={{ fontSize:36 }}>🚗</div>
          </div>
        </Link>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {menuItems.slice(1).map(item => (
            <Link key={item.href} href={item.href}
              style={{ background:'#151515', borderRadius:16, padding:'18px', textDecoration:'none', display:'block' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{item.icon}</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:14, color:'#fff' }}>{item.label}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{item.desc}</div>
            </Link>
          ))}
          <Link href="/login"
            style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:16, padding:'18px', textDecoration:'none', display:'block' }}
            onClick={e => { e.preventDefault(); signOut(); }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🚪</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:14, color:'#151515' }}>Cerrar sesión</div>
            <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>Salir de la app</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
