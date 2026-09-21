import { Compass, Map, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-500/30">
      {/* Cabecera / Navegación Simple */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-6 h-6 text-emerald-400" />
            <span className="text-lg font-bold tracking-tight">BarcelonaXplorer</span>
          </div>
          <nav className="text-sm font-medium text-zinc-400 space-x-6">
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Rutas</span>
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Manifiesto</span>
          </nav>
        </div>
      </header>

      {/* Sección Hero */}
      <main className="max-w-6xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 mb-8">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
          Motor Híbrido S+ Grade Operativo
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-br from-zinc-100 to-zinc-500">
          La ciudad, destilada.
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-zinc-400 mb-12">
          Escapa de las rutas genéricas y las trampas para turistas. BarcelonaXplorer combina sabiduría hiperlocal curada manualmente con precisión algorítmica para forjar experiencias tácticas inmutables.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/orchestrator" className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold h-12 px-8 rounded-md transition-colors flex items-center justify-center">
            <Map className="w-4 h-4 mr-2" />
            Iniciar Orquestador
          </Link>
          <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold h-12 px-8 rounded-md border border-zinc-700 transition-colors flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 mr-2" />
            Conoce el Escudo Anti-Trampas
          </button>
        </div>
      </main>
    </div>
  );
}
