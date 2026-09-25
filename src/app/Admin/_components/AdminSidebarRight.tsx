'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Activity, Terminal, Brain, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: typeof LayoutDashboard;
  readonly badge?: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', href: '/Admin', icon: LayoutDashboard },
  { label: 'Sensores', href: '/Admin/System', icon: Activity },
  { label: 'Bitácora', href: '/Admin/Logs', icon: Terminal },
  { label: 'Cognición RAG', href: '/Admin/Cognitive', icon: Brain },
];

export interface AdminSidebarRightProps {
  readonly nodeName?: string;
  readonly environmentName?: string;
  readonly securityMode?: string;
  readonly currentPath?: string;
}

export function AdminSidebarRight({
  nodeName = 'LOCAL / DEV',
  environmentName = 'Pruebas / Local',
  securityMode = 'Basic Auth (Edge)',
  currentPath,
}: AdminSidebarRightProps = {}) {
  const browserPathname = usePathname();
  const pathname = currentPath ?? browserPathname;

  const isItemActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/Admin') {
      return pathname === '/Admin';
    }
    return pathname.startsWith(href);
  };

  const isProductionNode = nodeName.toUpperCase().includes('NODO');

  return (
    <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-l border-layout-divider bg-surface-container/80 backdrop-blur-sm p-4 sm:p-6 flex flex-col justify-between shrink-0">
      <div className="space-y-4 lg:space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-layout-divider">
          <div className="flex items-center gap-2 text-content-primary font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SALA DE CONTROL</span>
          </div>
          <span
            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
              isProductionNode
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-sky-100 text-sky-800 border-sky-200'
            }`}
          >
            {nodeName}
          </span>
        </div>

        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
          <p className="hidden lg:block text-[11px] font-mono uppercase tracking-wider text-content-meta mb-2 px-3">
            Navegación Táctica
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 lg:py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-300 shadow-xs'
                    : 'text-content-secondary hover:bg-surface-subtle hover:text-content-primary'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="hidden lg:block pt-6 border-t border-layout-divider mt-6 space-y-3">
        <div className="text-xs text-content-meta font-mono space-y-1">
          <p className="flex items-center justify-between">
            <span>Seguridad:</span>
            <span className="text-emerald-600 font-semibold">{securityMode}</span>
          </p>
          <p className="flex items-center justify-between">
            <span>Entorno:</span>
            <span className="text-zinc-700 font-semibold">{environmentName}</span>
          </p>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 text-xs text-content-meta hover:text-content-primary border border-layout-divider rounded-md py-1.5 bg-surface-container transition-colors"
        >
          <span>Retornar al Ecosistema</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}
