# Sistema de diseño VeraMotors · Automotive Tech – Industrial Premium

CSS plano con custom properties. Sin dependencias nuevas.

## Archivos y orden de carga

`src/index.css` importa, en este orden:

1. `tokens.css`: paleta, tipografía, espaciado, radios, sombras.
2. `base.css`: reset, tipografía, inputs y tablas sin clase (especificidad 0 con `:where`).
3. `components.css`: primitivas `.vm-*` y clases históricas compartidas (`.os-table`, `.modal-*`, `.btn-guardar`…).

Después se carga el CSS de cada módulo, que puede ajustar lo anterior sin `!important`.

## Reglas

- **Color:** usar solo tokens semánticos (`--surface`, `--text`, `--primary`, `--danger-soft`…). No escribir hex en módulos.
- **Acento naranja (`--accent`):** una sola acción principal por pantalla o modal (`.vm-btn-accent`, `.btn-guardar`, `.btn-nuevo-*`), más indicadores activos. Siempre con `--on-accent` (texto oscuro).
- **Petróleo (`--primary`):** enlaces, pestañas activas, encabezados oscuros.
- **Estados:** verde/`--success`, amarillo/`--warning`, rojo/`--danger`, siempre con texto o icono además del color.
- **Tipografía:**
  - `--font-display` (Barlow Semi Condensed): títulos, KPI, encabezados de tabla.
  - `--font-body` (Inter): interfaz y lectura.
  - `--font-mono` (JetBrains Mono): placas, códigos, VIN.
- **Iconos:** Material Symbols Outlined (`<span className="material-symbols-outlined">build</span>`). Sin emojis en la interfaz. En `<option>` no caben iconos: texto solo.
- **Espaciado:** `--s-1` (4px) a `--s-8` (32px). **Radios:** `--r-sm` 4, `--r` 6, `--r-lg` 10 (tarjetas y modales).

## Piezas disponibles

| Necesidad | Clase |
|---|---|
| Cabecera de página | `.vm-page-head` (o `.bancos-header`, `.os-header`…) |
| Botones | `.vm-btn` + `.vm-btn-accent` / `-primary` / `-secondary` / `-ghost` / `-danger`, `.vm-btn-sm`, `.vm-icon-btn` |
| Acción en tabla | `.btn-act-table` + `.link` / `.diag` / `.nps` / `.trace` / `.danger` |
| Tarjeta | `.vm-card`, `.vm-card-head`, `.vm-card-body` |
| KPI con escala graduada | `.vm-kpi-grid` > `.vm-kpi` > `.vm-kpi-label` + `.vm-kpi-value` |
| Pestañas | `.vm-tabs` > `.vm-tab.active` |
| Filtros y búsqueda | `.vm-filter-bar`, `.vm-search`, `.filter-date` |
| Tabla | `.vm-table-wrap` > `.vm-table`, `.vm-num` (cifras a la derecha) |
| Estado | `.vm-badge` + `-success` / `-warning` / `-danger` / `-info` / `-accent` (`.is-plain` sin punto) |
| Placa vehicular | `.vm-plate` |
| Código de orden o documento | `.vm-code` |
| Formularios | `.form-grid`, `.form-group`, `.form-group-full`, `.vm-field`, `.vm-form-section-title` |
| Modal | `.modal-overlay` > `.modal-content` > `.modal-header` + `.modal-body` + `.modal-footer`, `.btn-close` |
| Vacío, carga, alerta | `.vm-empty`, `.vm-loading`, `.vm-skeleton`, `.vm-alert` + `-warning` / `-info` / `-success` |

## Chasis y navegación

- Menús, migas de pan y buscador salen de `src/config/navegacion.js` (mapa rol → secciones).
- Etapas del flujo del taller: `src/config/flujoTaller.js`.
- Marca y silueta: `src/components/Brand/Brand.jsx`.
