# [OPERATIVO] Localización Inmutable de Tipografías con next-font-local en Build de Docker (P2)

**Identificador:** PBI-ASSET-FONT-LOCAL-001  
**Historia de Usuario Vinculada:** [HU-KAIZEN-002](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Hardening%20del%20Pipeline%20de%20Despliegue,%20Resiliencia%20IaaC%20e%20Higiene%20de%20Almacenamiento%20v2.2.0.md)  
**Auditoría de Origen:** [AUD-OPS-PROD-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Incidente%20de%20Despliegue%20y%20Estado%20del%20Nodo%20de%20Produccion.md)  
**Prioridad:** P2 (Media)  
**Estimación:** 2 Story Points  
**Estatus:** ✅ Realizado  
**Fecha de Implementación:** 2026-09-26  
**Módulos Afectados:** `src/app/layout.tsx`, `src/public/fonts/`  
**Marco Normativo:** Protocolo de Acero — Grado S+ · Axiomas I, II y V  

---

## 1. Contexto y Justificación

Durante la fase de construcción del contenedor web (`RUN npm run build`), Turbopack invocaba a Google Fonts para descargar las fuentes `Geist` y `Geist_Mono` definidas en `src/app/layout.tsx` mediante `next/font/google`.

Esta dependencia externa en tiempo de compilación introducía:
1. Puntos únicos de fallo por conectividad externa, configuración DNS IPv6 o saturación transitoria de disco.
2. Latencia añadida de red durante cada build en el nodo de producción.

La solución canónica implementada aloja los binarios TTF de las fuentes en `src/public/fonts/` y los consume de manera inmutable mediante `next/font/local`.

---

## 2. Requerimientos Técnicos Implementados

1. **Aprovisionamiento Inmutable de Fuentes:**
   - Variantes variables `Geist-VariableFont_wght.ttf` y `GeistMono-VariableFont_wght.ttf` incorporadas en `src/public/fonts/`.
2. **Refactorización de Layout Global:**
   - En `src/app/layout.tsx`, sustitución de `next/font/google` por `next/font/local`.
   - Preservación exacta de variables CSS: `--font-geist-sans` y `--font-geist-mono`.
   - Propiedad `display: "swap"` para optimizar renderizado tipográfico.
3. **Verificación de Aislamiento de Red:**
   - Compilación completa con `npm run build` (Turbopack) sin llamadas salientes a `fonts.googleapis.com`.
   - Validación de tipos con `npx tsc --noEmit` y `npm run lint`.

---

## 3. Criterios de Aceptación (BDD) — Verificación Empírica

- **Dado** un entorno Docker o de compilación sin conectividad exterior a Google Fonts.
- **Cuando** se ejecuta `npm run build`.
- **Entonces** Next.js compila y enlaza las tipografías localmente sin emitir ninguna advertencia ni error de conexión a `fonts.googleapis.com`, completando las 12 rutas estáticas en 8 segundos.

---

## 4. Registro de Evidencias de Ejecución

- **Binarios de Fuentes:**
  - `src/public/fonts/Geist-VariableFont_wght.ttf` (169,056 bytes)
  - `src/public/fonts/GeistMono-VariableFont_wght.ttf` (171,948 bytes)
- **Compilador TypeScript:** `npx tsc --noEmit` -> Exit Code `0`.
- **Linter AST:** `eslint` -> Exit Code `0`.
- **Next.js Production Build:** `12/12` rutas estáticas compiladas exitosamente.
