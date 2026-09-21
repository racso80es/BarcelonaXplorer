import React from 'react';
import { OrchestratorBlock } from '@/components/OrchestratorBlock';
import { TacticalSpark } from '@/components/TacticalSpark';
import { CloudRain, ShieldAlert, Navigation } from 'lucide-react';

export default function TestUIPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8 flex flex-col items-center">
      <h1 className="text-zinc-100 text-2xl font-bold mb-12 border-b border-zinc-800 pb-4 w-full max-w-3xl">
        Test UI: Topología Visual de Componentes
      </h1>

      <div className="w-full max-w-4xl flex flex-col space-y-8">
        
        {/* Caso 1: Usuario */}
        <div>
          <h2 className="text-zinc-400 text-sm font-mono mb-4">Caso 1: Input de Usuario (Yunque inamovible)</h2>
          <OrchestratorBlock
            role="user"
            content="Quiero visitar la Sagrada Familia por la tarde y cenar tapas auténticas en el barrio de Gràcia. Presupuesto moderado."
            timestamp={new Date()}
          />
          
          <div className="mt-4 flex flex-col space-y-1">
            <TacticalSpark 
              id="ts-1"
              type="weather"
              insight="Probabilidad de lluvia ligera (17:00). Recomiendo llevar paraguas."
              icon={CloudRain}
              urgency="medium"
            />
            <TacticalSpark 
              id="ts-2"
              type="security"
              insight="Zonas de carteristas detectadas en trayecto L5. Mantenga pertenencias seguras."
              icon={ShieldAlert}
              urgency="high"
            />
            <TacticalSpark 
              id="ts-3"
              type="logistics"
              insight="Metro L5 opera con normalidad. Tiempo estimado 12 min."
              icon={Navigation}
              urgency="low"
            />
          </div>
        </div>

        {/* Caso 2: IA Procesando */}
        <div>
          <h2 className="text-zinc-400 text-sm font-mono mb-4 mt-8">Caso 2: IA Orquestando (Borde animado, Glassmorphism)</h2>
          <OrchestratorBlock
            role="ai"
            content="Recopilando telemetría de densidad turística, validando horarios de acceso a la Basílica y calculando rutas logísticas hacia Gràcia..."
            timestamp={new Date()}
            status="orchestrating"
          />
        </div>

        {/* Caso 3: IA Completada */}
        <div>
          <h2 className="text-zinc-400 text-sm font-mono mb-4 mt-8">Caso 3: IA Finalizada (Losa estática)</h2>
          <OrchestratorBlock
            role="ai"
            content={<>
              <p className="mb-2"><strong>Ruta Táctica Consolidada:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>16:00 - Acceso Sagrada Familia (Fachada Nacimiento).</li>
                <li>18:30 - Desplazamiento línea L5 (Metro) hacia Diagonal.</li>
                <li>19:30 - Cena en *La Esquinica* o similar en Gràcia.</li>
              </ul>
            </>}
            timestamp={new Date()}
            status="completed"
          />
        </div>

      </div>
    </div>
  );
}
