// Etapas del flujo de una orden de servicio, en orden, compartidas por el
// tablero Kanban y el dashboard.
export const ETAPAS_TALLER = [
    { id: "Recepción", titulo: "Recepción", icono: "directions_car" },
    { id: "Diagnóstico", titulo: "Diagnóstico", icono: "troubleshoot" },
    { id: "Repuestos", titulo: "Repuestos", icono: "category" },
    { id: "Aprobación", titulo: "Aprobación", icono: "approval" },
    { id: "Reparación", titulo: "Reparación", icono: "car_repair" },
    { id: "Control de Calidad", titulo: "Control Calidad", icono: "verified" },
    { id: "Entrega", titulo: "Entrega", icono: "key" },
];

export const normalizarEstado = (estado) => {
    if (!estado) return "Recepción";
    if (estado === "Pendiente") return "Recepción";
    if (estado === "En Espera") return "Repuestos";
    if (estado === "En Reparación") return "Reparación";
    if (estado === "Aprobado") return "Aprobación";
    if (estado === "Completado") return "Entrega";
    return estado;
};
