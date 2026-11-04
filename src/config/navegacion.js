// Mapa de navegación por rol. Es la única fuente de los menús del sidebar,
// las migas de pan y el buscador de módulos. Las rutas visibles por rol se
// mantienen tal cual estaban: cambiar aquí un ítem cambia lo que ese rol ve.

const ITEM = {
    dashboard: { to: "/dashboard", label: "Dashboard", icon: "speed" },
    citas: { to: "/citas", label: "Calendario de Citas", icon: "calendar_month" },
    kanban: { to: "/kanban", label: "Tablero de Control", icon: "view_kanban" },
    clientes: { to: "/clientes", label: "Clientes", icon: "groups" },
    cotizaciones: { to: "/cotizaciones", label: "Cotizaciones", icon: "request_quote" },
    inventario: { to: "/inventario", label: "Inventario", icon: "inventory_2" },
    ordenes: { to: "/ordenes-servicio", label: "Órdenes de Servicio", icon: "car_repair" },
    facturacion: { to: "/facturacion", label: "Facturación", icon: "receipt_long" },
    reportes: { to: "/reportes", label: "Reportes", icon: "summarize" },
    metricas: { to: "/metricas", label: "Métricas", icon: "monitoring" },
    asistencia: { to: "/asistencia", label: "Asistencia", icon: "badge" },
    proveedores: { to: "/proveedores", label: "Proveedores", icon: "local_shipping" },
    compras: { to: "/compras", label: "Compras", icon: "shopping_cart" },
    bancos: { to: "/bancos", label: "Bancos", icon: "account_balance" },
    configuracion: { to: "/configuracion", label: "Configuración", icon: "settings" },
};

export const NAVEGACION_POR_ROL = {
    "Administrador": [
        { titulo: "Principal", items: [ITEM.dashboard, ITEM.citas, ITEM.kanban] },
        { titulo: "Gestión", items: [ITEM.clientes, ITEM.cotizaciones, ITEM.inventario, ITEM.ordenes, ITEM.facturacion] },
        { titulo: "Análisis", items: [ITEM.reportes, ITEM.metricas] },
        { titulo: "RRHH", items: [ITEM.asistencia] },
        { titulo: "Administración", items: [ITEM.proveedores, ITEM.compras, ITEM.bancos, ITEM.configuracion] },
    ],
    "Asesor de Servicio": [
        { titulo: "Principal", items: [ITEM.dashboard, ITEM.citas, ITEM.kanban] },
        { titulo: "Gestión", items: [ITEM.clientes, ITEM.cotizaciones, ITEM.ordenes, ITEM.facturacion] },
        { titulo: "Análisis", items: [ITEM.metricas] },
    ],
    "Asesor de Repuestos": [
        { titulo: "Principal", items: [ITEM.dashboard, ITEM.kanban] },
        { titulo: "Gestión", items: [ITEM.inventario, ITEM.ordenes, ITEM.compras, ITEM.proveedores] },
        { titulo: "Análisis", items: [ITEM.metricas] },
    ],
    "Técnico Automotriz": [
        { titulo: "Principal", items: [{ ...ITEM.kanban, label: "Mis Tickets Asignados", icon: "assignment_ind" }] },
        { titulo: "Taller y diagnóstico", items: [{ ...ITEM.ordenes, label: "Diagnóstico y Reparación" }] },
        { titulo: "Análisis", items: [{ ...ITEM.metricas, label: "Mis Métricas" }] },
    ],
};

// Secciones de un rol; un rol desconocido no tiene menú.
export const obtenerSeccionesDeRol = (rol) => NAVEGACION_POR_ROL[rol] || [];

// Etiqueta de reserva para las rutas que el rol alcanza por URL sin tenerlas en su menú.
const SECCION_POR_DEFECTO = NAVEGACION_POR_ROL["Administrador"];

export const obtenerMigas = (rol, ruta) => {
    for (const secciones of [obtenerSeccionesDeRol(rol), SECCION_POR_DEFECTO]) {
        for (const seccion of secciones) {
            const item = seccion.items.find((i) => i.to === ruta);
            if (item) return { seccion: seccion.titulo, modulo: item.label, icono: item.icon };
        }
    }
    return null;
};
