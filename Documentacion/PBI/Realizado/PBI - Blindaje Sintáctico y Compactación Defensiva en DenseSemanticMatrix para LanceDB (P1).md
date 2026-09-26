# [ARQUITECTURA] Documento Destilado: PBI - Blindaje Sintáctico y Compactación Defensiva en DenseSemanticMatrix para LanceDB

**Identificador:** PBI-COGN-MEM-006  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Fecha de Certificación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 6: Matriz de Densidad Polimórfica y Umbral Operativo (El Peaje Termodinámico)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%206:%20Matriz%20de%20Densidad%20Polim%C3%B3rfica%20y%20Umbral%20Operativo%20%28El%20Peaje%20Termodin%C3%A1mico%29.md)  
**Módulo:** `src/features/cognitive-memory/`  
**Entorno:** LanceDB, Apache Arrow, TypeScript 5.x, Vitest  
**Prioridad:** Alta (P1 - Blindaje Cognitivo y Mitigación de Desbordamiento de Tokens)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Mitigación de fragilidad operativa por reentrancia y desbordamiento de tokens en la generación de representaciones sintéticas de memoria vectorial.
- **Entorno:** Value Object inmutable [`DenseSemanticMatrix`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/cognitive-memory/dense-semantic-matrix.vo.ts).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico y Tolerancia Cero a la Inferencia):* Truncamiento defensivo determinista en cadenas accesorias (`vibe` limitado a máx 45 caracteres y `time_window` a máx 40 caracteres) y acotamiento de colecciones (`constraints` y `districts` limitados a un máximo de 3 elementos únicos de máx 25 y 20 caracteres cada uno, respectivamente).
  - *Filtro B (Determinismo y Cota de Tokens):* Garantía matemática de que `toDensePromptString()` se mantiene en $\le 45$ tokens equivalentes ($\le 280$ caracteres) incluso ante inyecciones masivas o inputs prolíficos.
  - *Filtro C (Eficiencia Operativa en LanceDB):* Serialización limpia hacia `toMetadata()` compatible con Apache Arrow sin tipos nulos corruptos ni cadenas infinitas.

---

## 1. Declaración de Intención (INVEST)

**Como** Arquitecto de Memoria Cognitiva y Guardián Termodinámico,  
**Quiero** que el Value Object `DenseSemanticMatrix` sanitice, acote y trunque defensivamente las propiedades del payload al instanciarse,  
**Para** asegurar que la representación de prompt compacto (`toDensePromptString()`) y los metadatos serializados en LanceDB respeten estrictamente la cota termodinámica de $\le 45$ tokens, erradicando desbordamientos de contexto e inyecciones de ruido en el RAG.

---

## 2. Criterios de Aceptación Certificados (Aduana de Fricción)

- [x] **CA-1 (Truncamiento de Cadenas Largas):** En `DenseSemanticMatrix.create()`, el campo `vibe` se recorta defensivamente a un máximo de 45 caracteres con elipsis `'...'` si excede dicho umbral, y `time_window` se recorta a 40 caracteres, eliminando caracteres de control y saltos de línea superfluos (`.replace(/\s+/g, ' ')`).
- [x] **CA-2 (Acotamiento Defensivo de Arrays):** Las listas de `constraints` y `districts` se filtran para eliminar valores vacíos, se deduplican, se acotan a un máximo de 3 elementos cada una, y cada elemento individual se limita a un máximo de 25 caracteres (`constraints`) y 20 caracteres (`districts`).
- [x] **CA-3 (Cota Termodinámica $\le 45$ tokens):** `toDensePromptString()` garantiza una salida sintética estandarizada ($\le 280$ caracteres) que respeta la cota proyectada de tokens, manteniendo el formato `[Grupo: ... | Ventana: ... | Vibe: ... | Distritos: ... | Restricciones: ...]`.
- [x] **CA-4 (Verificación de Oráculos):** Pruebas unitarias colocadas en [`src/features/cognitive-memory/dense-semantic-matrix.vo.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/cognitive-memory/dense-semantic-matrix.vo.test.ts) validando escenarios adversarios de entrada desbordada con 100% de éxito en Vitest (6/6 tests pasando) y 0 errores en `tsc --noEmit` y ESLint.

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):**
   ```bash
   npx tsc --noEmit
   # Exit code: 0
   ```
2. **Linter AST (`eslint`):**
   ```bash
   npx eslint features/cognitive-memory/dense-semantic-matrix.vo.ts features/cognitive-memory/dense-semantic-matrix.vo.test.ts
   # Exit code: 0 (0 warnings, 0 errores)
   ```
3. **Suite de Pruebas Unitarias (`vitest`):**
   ```bash
   npx vitest run features/cognitive-memory/dense-semantic-matrix.vo.test.ts
   # 6 tests pasados (100% verde)
   ```
