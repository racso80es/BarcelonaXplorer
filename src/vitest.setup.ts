/**
 * Aduana del oráculo unitario (PBI-STEEL-009): sin red salvo override explícito en el test.
 */
const originalFetch = globalThis.fetch;

globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
  throw new Error(
    `Red prohibida en tests unitarios: ${String(args[0])}. Usa vi.stubGlobal('fetch', ...) en el test.`,
  );
}) as typeof fetch;

// Preservar referencia por si un test necesita restaurar
(globalThis as { __vitestOriginalFetch?: typeof fetch }).__vitestOriginalFetch =
  originalFetch;
