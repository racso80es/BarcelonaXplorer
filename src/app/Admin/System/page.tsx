import { PrismaClient } from '@prisma/client';

// Instancia global para evitar conexiones fantasma en desarrollo
const prisma = new PrismaClient();

// Directriz de Vía del Yunque: Evitar caché estática, evaluar en cada recarga
export const dynamic = 'force-dynamic';

export default async function SystemAdmin() {
  let dbStatus = { ok: false, msg: 'Desconectado' };
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = { ok: true, msg: 'Conexión S+ Grade Establecida' };
  } catch (error: any) {
    // AQUÍ INYECTAMOS LA TELEMETRÍA CRUDA
    dbStatus = { ok: false, msg: `Fallo: ${error.message || 'Desconocido'}` };
  }

  // Sensor 2: Aduana y Salida de Red (Cloudflare)
  let netStatus = { ok: false, msg: 'Desconectada' };
  try {
    // Un ping rápido a un DNS externo para validar el enrutamiento Docker -> Pi -> Internet
    const res = await fetch('https://1.1.1.1', { cache: 'no-store' });
    if (res.ok) netStatus = { ok: true, msg: 'Ruta de salida abierta' };
  } catch (error) {
    netStatus = { ok: false, msg: 'Sin salida a internet' };
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-mono">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl text-emerald-400 font-bold mb-8">[ NÚCLEO ] : Telemetría del Sistema</h1>
        
        <div className="grid gap-6">
          {/* Tarjeta MySQL */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-300">Persistencia Híbrida (MySQL)</h2>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${dbStatus.ok ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={dbStatus.ok ? 'text-green-400' : 'text-red-400'}>{dbStatus.msg}</span>
            </div>
          </div>

          {/* Tarjeta Red */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-300">Aduana / Red Externa</h2>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${netStatus.ok ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={netStatus.ok ? 'text-green-400' : 'text-red-400'}>{netStatus.msg}</span>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-sm text-gray-500 border-l-2 border-gray-600 pl-4 py-2">
          Directriz Táctica: En la próxima iteración arquitectónica, esta ruta será acorazada mediante middleware para responder únicamente a peticiones originadas desde el rango VPN.
        </p>
      </div>
    </div>
  );
}
