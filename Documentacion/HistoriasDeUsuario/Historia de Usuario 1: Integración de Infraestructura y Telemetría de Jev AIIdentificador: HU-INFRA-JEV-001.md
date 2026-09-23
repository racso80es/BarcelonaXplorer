Historia de Usuario 1: Integración de Infraestructura y Telemetría de Jev AIIdentificador: HU-INFRA-JEV-001Estatus: Listo para ImplementaciónEntorno: Next.js App Router (BFF) / Nodo de Producción 11 (10.0.10.11)   Componente: src/infrastructure/ai/jev/ & /Admin/System   1. Descripción GeneralComo Arquitecto de Software y Operador Técnico de BarcelonaXplorer,   Quiero encapsular el cliente de red y los contratos tipados de Jev AI dentro de la capa de infraestructura del monolito e integrar una sonda de salud en /Admin/System,   Para disponer de un motor determinista System One desacoplado de los casos de uso, garantizar tolerancia cero a tipos any en tiempo de compilación y auditar en tiempo real la disponibilidad y latencia del servicio desde el panel de control táctico.   2. Componentes Arquitectónicos y Contratos2.1. Ubicación y Estructura en el MonolitoPlaintextsrc/
├── application/
│   └── ports/
│       └── out/
│           └── ITypedDecisionEngine.ts      # Puerto de salida (DIP)
└── infrastructure/
    └── ai/
        └── jev/
            ├── jevClient.ts                 # Adaptador HTTP con fetch nativo y fail-soft
            ├── types.ts                     # Definiciones de primitivas Jev (Noul, Choice, Score)
            └── config.ts                    # Lectura tipada de variables (JEV_API_KEY, JEV_BASE_URL)
2.2. Contratos y Tipado Estricto (types.ts & ITypedDecisionEngine.ts)TypeScriptexport interface JevDecisionProbeResult {
  isHealthy: boolean;
  latencyMs: number;
  statusCode?: number;
  error?: string;
}

export interface ITypedDecisionEngine {
  evaluateHealth(): Promise<JevDecisionProbeResult>;
}
2.3. Sonda Térmica en /Admin/SystemSensor C (Jev Decision Engine): Sonda de servidor no bloqueante (force-dynamic) invocada desde src/app/Admin/System/page.tsx.   Mecánica: Ejecuta una evaluación mínima o ping autenticado contra el endpoint de Jev. Si el tiempo de respuesta supera los 800 ms o la API no responde, el sensor conmuta a estado WARN o ERROR.   Integración Tabular: Los fallos o eventos de degradación emiten telemetría que nutre directamente la bitácora visible en TelemetryRecentLogsCard mediante la DataTable<TelemetryLogItem>.   3. Criterios de Aceptación (Verificación Empírica)[ ] Escenario 1: Tipado e Inversión de Dependencias (DIP)Dado el cliente jevClient.ts implementando ITypedDecisionEngine.Cuando se compila el proyecto mediante npx tsc --noEmit.Entonces concluye con código de salida 0, sin ocurrencias de any y con tipado estricto de las primitivas de Jev.[ ] Escenario 2: Monitoreo en Tiempo Real en /Admin/SystemDado el panel de telemetría en /Admin/System.   Cuando el operador accede con credenciales válidas.   Entonces visualiza la tarjeta de estado del "Motor de Decisión Jev" con su semáforo de disponibilidad y latencia de respuesta en milisegundos.   [ ] Escenario 3: Resiliencia Perimetral (Fail-Soft)Dado un corte de conexión o degradación del servicio de Jev AI.Cuando el servidor ejecuta la sonda en /Admin/System.   Entonces la página no rompe con error 500; el sensor marca estado carmesí (ERROR) y persiste una traza descriptiva en los registros de telemetría de Prisma.   
