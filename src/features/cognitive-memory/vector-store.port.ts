/**
 * Contrato inmutable para la persistencia vectorial hexagonal de BarcelonaXplorer.
 * Principio DIP (La Vía del Yunque):
 * Desacopla la lógica de negocio y los motores RAG de la implementación subyacente (LanceDB).
 */

export interface VectorDocument<TMetadata = Record<string, unknown>> {
  readonly id: string;
  readonly vector: number[];
  readonly text: string;
  readonly metadata: TMetadata;
}

export interface VectorSearchResult<TMetadata = Record<string, unknown>> {
  readonly document: VectorDocument<TMetadata>;
  readonly score: number;
}

export interface VectorStorePingResult {
  readonly ok: boolean;
  readonly latencyMs: number;
  readonly path: string;
  readonly tableCount: number;
  readonly error?: string;
}

export type VectorDeleteFilter = string | { ids: string[] } | { expiredBefore: string };

export interface VectorSearchOptions {
  readonly limit?: number;
  readonly where?: string;
}

export interface IVectorStorePort {
  /**
   * Inserta o actualiza un lote de documentos vectoriales en la tabla indicada.
   */
  upsert(tableName: string, documents: VectorDocument[]): Promise<void>;

  /**
   * Búsqueda por similitud vectorial (K-Nearest Neighbors / Cosine).
   * Admite prefiltro SQL ('where') antes de calcular el top-K (PBI-MEM-003 CA-1).
   */
  search(
    tableName: string,
    queryVector: number[],
    limitOrOptions?: number | VectorSearchOptions,
  ): Promise<VectorSearchResult[]>;

  /**
   * Recupera documentos existentes por su identificador primario para deduplicación térmica.
   */
  getByIds(tableName: string, ids: string[]): Promise<VectorDocument[]>;

  /**
   * Poda y eliminación higiénica de vectores según predicado SQL o lista de identificadores.
   * Garantiza el principio de amnesia táctica y cumplimiento normativo.
   */
  delete(tableName: string, filter: VectorDeleteFilter): Promise<void>;

  /**
   * Comprueba si una tabla existe en el almacén vectorial.
   */
  tableExists(tableName: string): Promise<boolean>;

  /**
   * Sonda táctica de latencia y disponibilidad de descriptores en disco.
   */
  ping(): Promise<VectorStorePingResult>;
}
