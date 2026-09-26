# [OPERATIVO] Localización Inmutable de Tipografías con next-font-local en Build de Docker (P2)

**Identificador:** PBI-ASSET-FONT-LOCAL-001  
**Historia de Usuario Vinculada:** [HU-KAIZEN-002](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Hardening%20del%20Pipeline%20de%20Despliegue,%20Resiliencia%20IaaC%20e%20Higiene%20de%20Almacenamiento%20v2.2.0.md)  
**Auditoría de Origen:** [AUD-OPS-PROD-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Incidente%20de%20Despliegue%20y%20Estado%20del%20Nodo%20de%20Produccion.md)  
**Prioridad:** P2 (Media)  
**Estimación:** 2 Story Points  
**Estatus:** 📋 Pendiente  
**Módulos Afectados:** `src/app/layout.tsx`, `src/public/fonts/`  
**Marco Normativo:** Protocolo de Acero — Grado S+ · Axiomas I, II y V  

---

## 1. Contexto y Justificación

Durante la fase de construcción del contenedor web (`RUN npm run build`), Turbopack invoca a Google Fonts para descargar las fuentes `Geist` y `Geist_Mono` definidas en `src/app/layout.tsx` mediante `next/font/google`.

Esta dependencia externa en tiempo de compilación introduce:
1. Puntos únicos de fallo por conectividad externa, configuración DNS IPv6 o saturación transitoria de disco.
2. Latencia añadida de red durante cada build en el nodo de producción.

La solución canónica consiste en alojar los binarios WOFF2/TTF de las fuentes en `src/public/fonts/` y consumirlos mediante `next/font/local`.

---

## 2. Requerimientos Técnicos

1. Descargar las variantes de Geist (`Geist-VariableFont_wght.ttf` y `GeistMono-VariableFont_wght.ttf`) y ubicarlas en `src/public/fonts/`.
2. Refactorizar `src/app/layout.tsx` para sustituir `next/font/google` por `next/font/local`, manteniendo exactamente las mismas variables CSS (`--font-geist-sans` y `--font-geist-mono`).
3. Verificar que `next build` concluya con cero llamadas de red externas.

---

## 3. Criterios de Aceptación (BDD)

- **Dado** un entorno Docker sin conectividad a internet exterior.
- **Cuando** se ejecuta `npm run build`.
- **Entonces** Next.js compila y enlaza las tipografías localmente sin emitir ninguna advertencia ni error de conexión a `fonts.googleapis.com`.
