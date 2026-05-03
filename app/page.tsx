'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="bg-[#F8F8F5] text-[#151515] overflow-x-hidden">
      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ background: scrollY > 60 ? 'rgba(21,21,21,0.97)' : 'transparent' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RRSymbol size={36} />
            <div>
              <span className="font-bold text-white text-lg leading-none block" style={{fontFamily:'Montserrat,sans-serif'}}>Ruum Ruum</span>
              <span className="text-[#FFC400] text-[10px] font-bold tracking-widest uppercase leading-none" style={{fontFamily:'Montserrat,sans-serif'}}>by MoviliaX</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Cómo funciona','Diferenciadores','Clientes','Contacto'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g,'-').replace('ó','o')}`}
                className="text-white/70 hover:text-[#FFC400] text-sm transition-colors duration-200">
                {item}
              </a>
            ))}
          </div>
          <a href="#contacto" className="bg-[#FFC400] text-[#151515] font-bold text-sm px-5 py-2.5 hover:bg-white transition-colors duration-200" style={{fontFamily:'Montserrat,sans-serif'}}>
            Cotizar traslado
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative bg-[#151515] min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <path d="M-100 700 Q300 200 700 450 Q1100 700 1600 100" stroke="#FFC400" strokeWidth="120" fill="none" strokeLinecap="round"/>
          </svg>
          <div className="absolute inset-0" style={{backgroundImage:'linear-gradient(rgba(255,196,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,196,0,0.025) 1px, transparent 1px)', backgroundSize:'80px 80px'}}/>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-36 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 border border-[#FFC400]/30 bg-[#FFC400]/10 px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-[#FFC400] rounded-full animate-pulse"/>
              <span className="text-[#FFC400] text-xs font-bold tracking-widest uppercase" style={{fontFamily:'Montserrat,sans-serif'}}>Conductores certificados</span>
            </div>
            <h1 className="font-bold text-5xl md:text-6xl xl:text-7xl text-white leading-[0.95] mb-6" style={{fontFamily:'Montserrat,sans-serif'}}>
              Traslado<br/>
              <span className="text-[#FFC400]">vehicular</span><br/>
              con protocolo.
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-md">
              No entregues tu auto a ciegas. En Ruum Ruum cada traslado inicia con evidencia, continúa con seguimiento y termina con entrega documentada.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#contacto" className="bg-[#FFC400] text-[#151515] font-bold px-8 py-4 text-base hover:bg-white transition-all duration-200 flex items-center gap-2" style={{fontFamily:'Montserrat,sans-serif'}}>
                Cotizar traslado
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a href="#como-funciona" className="border border-white/20 text-white font-bold px-8 py-4 text-base hover:border-[#FFC400] hover:text-[#FFC400] transition-all duration-200" style={{fontFamily:'Montserrat,sans-serif'}}>
                Ver proceso
              </a>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative w-72 h-72 md:w-96 md:h-96">
              <div className="absolute inset-0 border border-[#FFC400]/20 rotate-45"/>
              <div className="absolute inset-6 border border-[#FFC400]/10 rotate-45"/>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <RRSymbol size={160} />
                  <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 160 160">
                    <path d="M10 120 Q40 60 80 80 Q120 100 150 40" stroke="#FFC400" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="4 4"/>
                    <circle cx="10" cy="120" r="5" fill="#FFC400"/>
                    <circle cx="150" cy="40" r="5" fill="#FFC400"/>
                    <path d="M142 34 L148 42 L158 30" stroke="#FFC400" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-[#1E88E5] text-white text-xs font-bold px-3 py-1.5" style={{fontFamily:'Montserrat,sans-serif'}}>TRAZABLE</div>
              <div className="absolute -bottom-4 -left-4 bg-[#FFC400] text-[#151515] text-xs font-bold px-3 py-1.5" style={{fontFamily:'Montserrat,sans-serif'}}>CERTIFICADO</div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-3 divide-x divide-white/10">
            {[
              {num:'100%', label:'Conductores validados'},
              {num:'Evidencia', label:'Fotográfica documentada'},
              {num:'Seguimiento', label:'Operativo en tiempo real'},
            ].map(({num,label}) => (
              <div key={label} className="px-8 first:pl-0 last:pr-0">
                <div className="text-[#FFC400] font-bold text-xl" style={{fontFamily:'Montserrat,sans-serif'}}>{num}</div>
                <div className="text-white/40 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND TICKER */}
      <section className="bg-[#FFC400] py-3 overflow-hidden">
        <div className="flex gap-12 animate-marquee">
          {Array(6).fill(['Seguridad','Evidencia','Trazabilidad','Conductores certificados','Protocolo operativo']).flat().map((item,i) => (
            <span key={i} className="font-bold text-[#151515] text-xs tracking-widest uppercase whitespace-nowrap flex items-center gap-4" style={{fontFamily:'Montserrat,sans-serif'}}>
              {item} <span className="text-[#151515]/30">·</span>
            </span>
          ))}
        </div>
      </section>

      {/* ESSENCE */}
      <section className="py-28 bg-[#F8F8F5]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[#FFC400] font-bold text-xs tracking-widest uppercase mb-4 block" style={{fontFamily:'Montserrat,sans-serif'}}>Esencia de marca</span>
              <h2 className="font-bold text-4xl md:text-5xl text-[#151515] leading-tight mb-6" style={{fontFamily:'Montserrat,sans-serif'}}>
                Un traslado serio<br/>deja evidencia.
              </h2>
              <p className="text-[#5F6368] text-lg leading-relaxed mb-6">
                Ruum Ruum convierte el traslado vehicular en un proceso profesional. Muchas personas entregan su vehículo sin información, sin evidencia y sin claridad sobre quién lo conduce.
              </p>
              <p className="font-semibold text-base border-l-4 border-[#FFC400] pl-4" style={{fontFamily:'Montserrat,sans-serif'}}>
                No movemos vehículos a ciegas. Movemos vehículos con seguridad, evidencia y trazabilidad.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {icon:'🛡️', title:'Misión', text:'Trasladar vehículos mediante conductores certificados, protocolos claros y seguimiento operativo de principio a fin.'},
                {icon:'🎯', title:'Visión', text:'Ser la referencia confiable en traslado vehicular documentado para particulares, agencias, talleres y flotillas.'},
                {icon:'📋', title:'Protocolo', text:'Cotización, asignación, recepción, evidencia, seguimiento, entrega y cierre documentado en cada traslado.'},
                {icon:'✅', title:'Confianza', text:'No pedimos confianza ciega. La construimos con información, evidencia y comunicación constante.'},
              ].map(({icon,title,text}) => (
                <div key={title} className="bg-white border border-[#151515]/8 p-6 hover:border-[#FFC400] transition-colors duration-200">
                  <div className="text-2xl mb-3">{icon}</div>
                  <div className="font-bold text-sm text-[#151515] mb-2" style={{fontFamily:'Montserrat,sans-serif'}}>{title}</div>
                  <p className="text-[#5F6368] text-xs leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="py-28 bg-[#151515]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[#FFC400] font-bold text-xs tracking-widest uppercase mb-4 block" style={{fontFamily:'Montserrat,sans-serif'}}>Proceso</span>
            <h2 className="font-bold text-4xl md:text-5xl text-white leading-tight" style={{fontFamily:'Montserrat,sans-serif'}}>Cómo funciona</h2>
          </div>
          <div className="relative">
            <div className="absolute top-10 left-0 right-0 h-px hidden md:block" style={{background:'repeating-linear-gradient(90deg,#FFC400 0,#FFC400 8px,transparent 8px,transparent 20px)'}}/>
            <div className="grid md:grid-cols-6 gap-6">
              {[
                {num:'01',icon:'💬',title:'Solicitas cotización',text:'Comparte origen, destino, vehículo y fecha.'},
                {num:'02',icon:'🔍',title:'Validamos',text:'Confirmamos datos y asignamos conductor certificado.'},
                {num:'03',icon:'🪪',title:'Conductor certificado',text:'Un conductor validado se presenta con gafete oficial.'},
                {num:'04',icon:'📸',title:'Evidencia inicial',text:'Documentamos el estado del vehículo antes del viaje.'},
                {num:'05',icon:'📍',title:'Seguimiento',text:'Trazabilidad operativa durante el trayecto completo.'},
                {num:'06',icon:'✅',title:'Entrega documentada',text:'Confirmación final con evidencia fotográfica.'},
              ].map(({num,icon,title,text}) => (
                <div key={num} className="text-center">
                  <div className="w-20 h-20 bg-[#FFC400] flex items-center justify-center text-3xl mx-auto mb-4 relative z-10">{icon}</div>
                  <div className="font-bold text-[#FFC400] text-xs tracking-widest mb-2" style={{fontFamily:'Montserrat,sans-serif'}}>{num}</div>
                  <div className="font-bold text-white text-sm mb-2" style={{fontFamily:'Montserrat,sans-serif'}}>{title}</div>
                  <p className="text-white/40 text-xs leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section id="diferenciadores" className="py-28 bg-[#F8F8F5]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[#FFC400] font-bold text-xs tracking-widest uppercase mb-4 block" style={{fontFamily:'Montserrat,sans-serif'}}>Por qué elegirnos</span>
            <h2 className="font-bold text-4xl md:text-5xl text-[#151515] leading-tight" style={{fontFamily:'Montserrat,sans-serif'}}>Diferenciadores clave</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {[
              {icon:'🪪',border:'#FFC400',title:'Conductores certificados',text:'No cualquier persona puede mover un vehículo Ruum Ruum. Cada conductor cumple criterios de validación, imagen, conducta y protocolo.'},
              {icon:'📸',border:'#1E88E5',title:'Evidencia documentada',text:'Cada traslado deja evidencia del estado inicial, trayecto relevante y entrega final. Tu vehículo no desaparece en el proceso.'},
              {icon:'📍',border:'#FFC400',title:'Trazabilidad real',text:'El cliente sabe qué ocurre con su vehículo durante todo el proceso. Seguimiento operativo de principio a fin.'},
            ].map(({icon,border,title,text}) => (
              <div key={title} className="bg-[#151515] text-white p-8 hover:-translate-y-1 transition-transform duration-200">
                <div className="text-4xl mb-5">{icon}</div>
                <div className="w-8 h-1 mb-5" style={{background:border}}/>
                <h3 className="font-bold text-lg mb-3" style={{fontFamily:'Montserrat,sans-serif'}}>{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {icon:'📋',title:'Protocolo operativo',text:'Cotización → Asignación → Recepción → Evidencia → Seguimiento → Entrega → Cierre. Cada paso definido y documentado.'},
              {icon:'🤝',title:'Confianza comprobable',text:'No pedimos confianza ciega. La construimos con información, evidencia y comunicación constante en cada traslado.'},
            ].map(({icon,title,text}) => (
              <div key={title} className="bg-white border border-[#151515]/8 p-8 flex gap-6 hover:border-[#FFC400] transition-colors duration-200">
                <div className="text-4xl flex-shrink-0">{icon}</div>
                <div>
                  <h3 className="font-bold text-[#151515] text-lg mb-2" style={{fontFamily:'Montserrat,sans-serif'}}>{title}</h3>
                  <p className="text-[#5F6368] text-sm leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE SERVE */}
      <section id="clientes" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[#FFC400] font-bold text-xs tracking-widest uppercase mb-4 block" style={{fontFamily:'Montserrat,sans-serif'}}>Clientes</span>
              <h2 className="font-bold text-4xl md:text-5xl text-[#151515] leading-tight mb-6" style={{fontFamily:'Montserrat,sans-serif'}}>
                Para particulares,<br/>agencias y empresas.
              </h2>
              <p className="text-[#5F6368] text-lg leading-relaxed mb-8">
                Ruum Ruum sirve a cualquier persona o empresa que necesite mover un vehículo con seguridad, evidencia y trazabilidad garantizadas.
              </p>
              <a href="#contacto" className="inline-flex items-center gap-2 bg-[#151515] text-white font-bold px-8 py-4 hover:bg-[#FFC400] hover:text-[#151515] transition-all duration-200" style={{fontFamily:'Montserrat,sans-serif'}}>
                Solicitar cotización
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {icon:'👤',label:'Clientes particulares'},
                {icon:'🏢',label:'Agencias automotrices'},
                {icon:'🔧',label:'Talleres mecánicos'},
                {icon:'🚗',label:'Flotillas empresariales'},
                {icon:'🏗️',label:'Empresas con vehículos'},
                {icon:'📦',label:'Servicios de entrega'},
              ].map(({icon,label}) => (
                <div key={label} className="border border-[#151515]/10 p-5 flex items-center gap-3 hover:bg-[#FFC400] hover:border-[#FFC400] transition-all duration-200 group cursor-pointer">
                  <span className="text-2xl">{icon}</span>
                  <span className="font-semibold text-sm text-[#151515]" style={{fontFamily:'Montserrat,sans-serif'}}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="py-24 bg-[#151515]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="text-[#FFC400] font-bold text-xs tracking-widest uppercase mb-12 block" style={{fontFamily:'Montserrat,sans-serif'}}>Manifiesto</span>
          <blockquote className="font-bold text-3xl md:text-4xl xl:text-5xl text-white leading-tight max-w-4xl mx-auto mb-16" style={{fontFamily:'Montserrat,sans-serif'}}>
            "Cuando alguien entrega sus llaves, no entrega solo un vehículo.{' '}
            <span className="text-[#FFC400]">Entrega tranquilidad.</span>"
          </blockquote>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Seguridad, evidencia y trazabilidad.',
              'Un traslado serio deja evidencia.',
              'La confianza también se documenta.',
              'De origen a destino, con trazabilidad.',
              'Tu vehículo se mueve con protocolo.',
            ].map(frase => (
              <span key={frase} className="border border-white/20 text-white/60 text-sm px-4 py-2 hover:border-[#FFC400] hover:text-[#FFC400] transition-colors duration-200 cursor-default">
                {frase}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contacto" className="py-28 bg-[#F8F8F5]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[#FFC400] font-bold text-xs tracking-widest uppercase mb-4 block" style={{fontFamily:'Montserrat,sans-serif'}}>Contacto</span>
            <h2 className="font-bold text-4xl md:text-5xl text-[#151515] leading-tight mb-4" style={{fontFamily:'Montserrat,sans-serif'}}>Cotiza tu traslado</h2>
            <p className="text-[#5F6368]">Comparte origen, destino, vehículo y fecha. Te respondemos por WhatsApp.</p>
          </div>
          <div className="bg-[#151515] p-10">
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              {[
                {label:'Nombre',placeholder:'Tu nombre completo',type:'text'},
                {label:'Teléfono / WhatsApp',placeholder:'+52 000 000 0000',type:'tel'},
                {label:'Ciudad de origen',placeholder:'Ciudad de origen',type:'text'},
                {label:'Ciudad de destino',placeholder:'Ciudad de destino',type:'text'},
              ].map(({label,placeholder,type}) => (
                <div key={label}>
                  <label className="block text-white/50 font-bold text-xs tracking-wider uppercase mb-2" style={{fontFamily:'Montserrat,sans-serif'}}>{label}</label>
                  <input type={type} placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 text-sm focus:outline-none focus:border-[#FFC400] transition-colors duration-200"/>
                </div>
              ))}
            </div>
            <div className="mb-5">
              <label className="block text-white/50 font-bold text-xs tracking-wider uppercase mb-2" style={{fontFamily:'Montserrat,sans-serif'}}>Tipo de vehículo y detalles adicionales</label>
              <textarea rows={3} placeholder="Marca, modelo, año. Cualquier detalle relevante."
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 text-sm focus:outline-none focus:border-[#FFC400] transition-colors duration-200 resize-none"/>
            </div>
            <button className="w-full bg-[#FFC400] text-[#151515] font-bold py-4 text-base hover:bg-white transition-colors duration-200 flex items-center justify-center gap-2" style={{fontFamily:'Montserrat,sans-serif'}}>
              Enviar solicitud de cotización
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <p className="text-white/30 text-xs text-center mt-4">Al enviar aceptas nuestros términos y condiciones. Respondemos en menos de 2 horas hábiles.</p>
          </div>
          <div className="mt-6 text-center">
            <p className="text-[#5F6368] text-sm mb-3">O escríbenos directamente por WhatsApp</p>
            <a href="https://wa.me/521XXXXXXXXXX" className="inline-flex items-center gap-2 border-2 border-[#151515] text-[#151515] font-bold px-6 py-3 hover:bg-[#151515] hover:text-white transition-all duration-200" style={{fontFamily:'Montserrat,sans-serif'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.035.507 3.952 1.4 5.63L.057 23.215a.75.75 0 00.908.928l5.74-1.32A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.935 9.935 0 01-5.03-1.368l-.36-.214-3.406.783.808-3.334-.235-.373A9.94 9.94 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Cotizar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#151515] border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <RRSymbol size={40} />
            <div>
              <div className="font-bold text-white text-base leading-none" style={{fontFamily:'Montserrat,sans-serif'}}>Ruum Ruum</div>
              <div className="text-[#FFC400] text-[10px] font-bold tracking-widest uppercase" style={{fontFamily:'Montserrat,sans-serif'}}>by MoviliaX</div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white/30 text-xs">Traslado vehicular con conductores certificados</p>
            <p className="text-white/20 text-xs mt-1">Seguridad · Evidencia · Trazabilidad en cada viaje</p>
          </div>
          <div className="text-white/20 text-xs">© {new Date().getFullYear()} Ruum Ruum by MoviliaX</div>
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@400;500&display=swap');
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
          width: max-content;
        }
      `}</style>
    </main>
  );
}

function RRSymbol({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#FFC400"/>
      <text x="50" y="70" textAnchor="middle" fontFamily="Montserrat,Arial,sans-serif" fontWeight="900" fontSize="54" fill="#151515" letterSpacing="-6">RR</text>
    </svg>
  );
}
