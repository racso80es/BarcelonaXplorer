# [ARQUITECTURA] Historia de Usuario: Auditoría de Fricción Algorítmica (Evaluación Arquitectónica A vs B)

**Identificador:** HU-ARCH-FRIC-001  
**Estatus:** En Curso / Fase 1 Realizada (PBI-ARCH-YAML-001 Certificado S+ Grade)  
**Fecha de Revisión:** 2026-09-25  
**Autor:** Vértice Biológico / Nodo de Control  
**Ubicación:** `Documentacion/HistoriasDeUsuario/` (Permanece activa en backlog activo durante la ejecución de PBI-ARCH-TEST-001 y PBI-ARCH-APPLY-001)

### Trazabilidad de PBIs Vinculados:
- [x] [PBI-ARCH-YAML-001: Consolidación Declarativa YML y Erradicación de Configuración JSON Redundante](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Consolidaci%C3%B3n%20Declarativa%20YML%20y%20Erradicaci%C3%B3n%20de%20Configuraci%C3%B3n%20JSON%20Redundante.md) — **Completado / Certificado S+ Grade**
- [ ] [PBI-ARCH-TEST-001: Test de Fricción Algorítmica: Evaluación Empírica de Opciones Arquitectónicas (A vs B)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Test%20de%20Fricci%C3%B3n%20Algor%C3%ADtmica%20-%20Evaluaci%C3%B3n%20Emp%C3%ADrica%20de%20Opciones%20Arquitect%C3%B3nicas%20%28A%20vs%20B%29.md) — **Pendiente de Forja en Ramas de Laboratorio**
- [ ] [PBI-ARCH-APPLY-001: Aplicación Definitiva de Modificaciones Arquitectónicas Post-Veredicto](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Aplicaci%C3%B3n%20Definitiva%20de%20Modificaciones%20Arquitect%C3%B3nicas%20Post-Veredicto.md) — **Pendiente de Evaluación**

---

## 1. Descripción General (INVEST)

**Como** Arquitecto del Ecosistema (Vértice Biológico),  
**Quiero** someter una micro-funcionalidad real a un test de implementación dual enfrentando el modelo actual (Arquitectura Fragmentada) contra el modelo propuesto (Vertical Slicing / Localidad de Comportamiento),  
**Para** obtener telemetría empírica que dictamine qué estructura minimiza la entropía cognitiva de la IA, reduce las alucinaciones estructurales y acelera el desarrollo autónomo en Grado S+.

---

## 2. Fundamentos de la Prueba (El Protocolo de Acero)

Esta historia de usuario se rige por la aplicación directa del Protocolo de Acero sobre nuestro propio código. No evaluaremos la belleza del diseño para el ojo humano, sino su eficiencia termodinámica para un Agente IA (Google Antigravity / Cursor).

- **Economía Termodinámica (Filtro C):** La evaluación penalizará el diseño que obligue al modelo a realizar múltiples saltos espaciales (context hops) para comprender un flujo de datos.
- **Tolerancia Cero a la Inferencia:** Se premiará la arquitectura donde el esquema de validación y la restricción tipada impidan físicamente que la IA tome decisiones basadas en suposiciones implícitas.
- **Oráculo de Autocorrección:** La prueba valorará positivamente el entorno que devuelva errores de compilación deterministas o fallos de linter instantáneos, permitiendo a la IA corregirse sin requerir el escaneo de logs humanos.

---

## 3. Métricas de Telemetría a Recolectar

Durante la ejecución en ambas ramas, el operador (o el agente Argos) registrará los siguientes vectores:

- **Carga de Contexto (Tokens):** Cantidad total de archivos y líneas de código que la IA necesita leer inicialmente para comprender el dominio de la tarea.
- **Índice de Fricción (Iteraciones):** Número de prompts correctivos que el Vértice Biológico debe introducir para que la IA complete la tarea con éxito (ideal = 1).
- **Tasa de Interceptación (Errores Mecánicos):** Cantidad de errores detectados en tiempo de compilación (positivos, porque guían a la IA) frente a errores lógicos detectados en tiempo de ejecución (negativos, porque indican fallas en el contrato).
- **Desgaste Espacial:** Frecuencia con la que la IA se equivoca de directorio al intentar crear, modificar o importar un archivo.

---

## 4. Proceso de Ejecución (Línea de Montaje)

El test se ejecutará bajo un entorno controlado simulando un caso de uso idéntico para ambas topologías.

- **Fase 1: Aislamiento del Laboratorio.**  
  Crear dos ramas independientes en el repositorio huérfanas de master: `feat/test-arch-fragmentada` (Rama A) y `feat/test-arch-localidad` (Rama B).
- **Fase 2: Selección del Vector de Prueba.**  
  Definir un objetivo atómico y de alto valor (ej. implementar una nueva entidad autovalidada en los tactical metadata de un Template en BarcelonaXplorer).
- **Fase 3: Inyección Ciega (Ejecución).**  
  - Activar el IDE en la Rama A. Inyectar un prompt estándar y directo exigiendo la implementación de la feature. Registrar métricas.
  - Limpiar la ventana de contexto de la IA.
  - Activar el IDE en la Rama B. Inyectar exactamente el mismo prompt. Registrar métricas.
- **Fase 4: Evaluación de Argos.**  
  Comparar la telemetría de ambas ejecuciones. El modelo ganador será aquel que haya requerido menor intervención humana (fricción) y haya producido un artefacto más robusto desde la primera generación.

---

## 5. Criterios de Aceptación (Certificación S+ Grade)

- [ ] Se han documentado las métricas de Carga de Contexto e Índice de Fricción para ambos caminos arquitectónicos.
- [ ] Se ha evaluado empíricamente qué modelo genera menos errores silenciosos de runtime y más bloqueos preventivos de compilación.
- [ ] El Veredicto Final ha sido consolidado en un documento de Arquitectura de Decisiones (ADR) o en el Cúmulo, declarando la topología ganadora como el nuevo estándar oficial para el desarrollo guiado por IA en el proyecto.
