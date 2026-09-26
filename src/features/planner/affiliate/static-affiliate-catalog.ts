import { WaypointOption } from './affiliate-enricher.schema';

/**
 * Catálogo Estático Curado de Respaldo Táctico (Fail-Soft Offline).
 * Protocolo de Acero — Grado S+
 * Proporciona opciones inmutables pre-verificadas cuando los proveedores externos caen o están en estado OPEN.
 */
export const STATIC_AFFILIATE_CATALOG: Record<'GASTRONOMY' | 'CULTURE' | 'ACTIVITY', WaypointOption[]> = {
  GASTRONOMY: [
    {
      id: 'static-gastro-1',
      title: 'El Xampanyet / Bodega La Palma (Born & Gòtic)',
      description: 'Selección tradicional de tapas y vermut artesanal con más de 80 años de historia.',
      provider: 'THEFORK',
      affiliateUrl: 'https://www.thefork.es/restaurante/el-xampanyet?tag=bcn_xplorer',
      priceEstimate: '20€ - 35€',
      rating: 4.8,
      isSelected: true,
    },
    {
      id: 'static-gastro-2',
      title: 'Cervecería Catalana (Eixample)',
      description: 'Clásico indiscutible para montaditos y raciones de proximidad sin reservas complejas.',
      provider: 'THEFORK',
      affiliateUrl: 'https://www.thefork.es/restaurante/cerveceria-catalana?tag=bcn_xplorer',
      priceEstimate: '25€ - 40€',
      rating: 4.7,
      isSelected: false,
    },
  ],
  CULTURE: [
    {
      id: 'static-culture-1',
      title: 'Basílica de la Sagrada Família (Acceso Canónico)',
      description: 'Reserva prioritaria sin colas para el monumento insignia de Antoni Gaudí.',
      provider: 'CIVITATIS',
      affiliateUrl: 'https://www.civitatis.com/es/barcelona/entrada-sagrada-familia/?aid=bcn_xplorer',
      priceEstimate: '26€ - 36€',
      rating: 4.9,
      isSelected: true,
    },
    {
      id: 'static-culture-2',
      title: 'Casa Batlló / La Pedrera (Ruta Modernista Paseo de Gracia)',
      description: 'Visita inmersiva a las joyas del modernismo catalán.',
      provider: 'CIVITATIS',
      affiliateUrl: 'https://www.civitatis.com/es/barcelona/entrada-casa-batllo/?aid=bcn_xplorer',
      priceEstimate: '29€ - 39€',
      rating: 4.8,
      isSelected: false,
    },
  ],
  ACTIVITY: [
    {
      id: 'static-activity-1',
      title: 'Ruta Peatonal por el Laberinto del Barrio Gótico',
      description: 'Paseo autoguiado por plazas medievales, muralla romana y rincones sin aglomeraciones.',
      provider: 'NONE',
      priceEstimate: 'Gratis',
      rating: 4.9,
      isSelected: true,
    },
    {
      id: 'static-activity-2',
      title: 'Mirador de los Jardines de Miramar (Montjuïc)',
      description: 'Vistas panorámicas sobre el puerto y el frente marítimo de Barcelona.',
      provider: 'NONE',
      priceEstimate: 'Gratis',
      rating: 4.7,
      isSelected: false,
    },
  ],
};
