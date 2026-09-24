import { ReactNode } from 'react';
import { AdminSidebarRight } from './_components/AdminSidebarRight';

export default function AdminRootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const rawEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  const isProd = rawEnv === 'production';
  const nodeName = process.env.NODE_NAME || (isProd ? 'NODO 11' : 'LOCAL / DEV');
  const environmentName =
    rawEnv === 'production'
      ? 'Producción'
      : rawEnv === 'staging'
        ? 'Staging'
        : 'Pruebas / Local';
  const securityMode = 'Basic Auth (Edge)';

  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary font-sans flex flex-col lg:flex-row">
      {/* Área de Trabajo Fluida (Izquierda en desktop, centro en móvil) */}
      <main className="flex-1 min-w-0 order-last lg:order-first">
        {children}
      </main>

      {/* HUD Táctico (Arriba en móvil gracias a order-first, fijado a la derecha en lg:order-last) */}
      <div className="order-first lg:order-last">
        <AdminSidebarRight
          nodeName={nodeName}
          environmentName={environmentName}
          securityMode={securityMode}
        />
      </div>
    </div>
  );
}
