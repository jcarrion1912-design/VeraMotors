import { useEffect, useState } from "react";
import { useRole } from "../../context/authContext";
import { obtenerODS, cambiarEstadoODS } from "../../services/odsService";
import { obtenerUsuarios } from "../../services/usuariosService";
import "./Kanban.css";

const COLUMNAS = [
    { id: "Recepción", titulo: "Recepción", color: "#3b82f6" },
    { id: "Diagnóstico", titulo: "Diagnóstico", color: "#eab308" },
    { id: "Repuestos", titulo: "Repuestos", color: "#a855f7" },
    { id: "Aprobación", titulo: "Aprobación", color: "#06b6d4" },
    { id: "Reparación", titulo: "Reparación", color: "#f97316" },
    { id: "Control de Calidad", titulo: "Control Calidad", color: "#8b5cf6" },
    { id: "Entrega", titulo: "Entrega", color: "#22c55e" }
];

const normalizarEstado = (estado) => {
    if (!estado) return "Recepción";
    if (estado === "Pendiente") return "Recepción";
    if (estado === "En Espera") return "Repuestos";
    if (estado === "En Reparación") return "Reparación";
    if (estado === "Aprobado") return "Aprobación";
    if (estado === "Completado") return "Entrega";
    return estado;
};

function Kanban() {
    const { rolActivo, ROLES } = useRole();
    const esTecnico = rolActivo === ROLES.TECNICO;

    const [busqueda, setBusqueda] = useState("");
    const [tarjetas, setTarjetas] = useState([]);

    const cargarODS = async () => {
        try {
            const [dataODS, usuariosData] = await Promise.all([
                obtenerODS(),
                obtenerUsuarios().catch(() => [])
            ]);

            const lista = Array.isArray(dataODS) ? dataODS : [];
            const listaUsuarios = Array.isArray(usuariosData) ? usuariosData : [];

            const mapeadas = lista.map((item) => {
                const tecnico = listaUsuarios.find((u) => Number(u.user_id) === Number(item.tecnico_id));
                const estadoLimpio = normalizarEstado(item.estado_actual);

                return {
                    id: item.ods_id,
                    codigo: item.codigo_ods || `ODS-${item.ods_id}`,
                    cliente: item.cliente_nombre || "Cliente",
                    vehiculo: `${item.vehiculo_placa || "Sin placa"}`,
                    motivo: item.tipo_procedimiento || "Servicio general",
                    personal: tecnico ? tecnico.nombre : `Técnico ${item.tecnico_id || "sin asignar"}`,
                    estado: estadoLimpio,
                    prioridad: estadoLimpio === "Entrega" ? "Normal" : "Alta"
                };
            });

            setTarjetas(mapeadas);
        } catch (error) {
            console.error("Error cargando kanban:", error);
        }
    };

    useEffect(() => {
        cargarODS();
    }, []);

    const moverEstado = async (id, direccion) => {
        const tarjetaActual = tarjetas.find((t) => t.id === id);
        if (!tarjetaActual) return;

        const idxActual = COLUMNAS.findIndex((c) => c.id === tarjetaActual.estado);
        const nuevoIdx = direccion === "adelante" ? idxActual + 1 : idxActual - 1;
        if (nuevoIdx < 0 || nuevoIdx >= COLUMNAS.length) return;

        const nuevoEstado = COLUMNAS[nuevoIdx].id;

        try {
            await cambiarEstadoODS(id, nuevoEstado);
            setTarjetas((prev) => prev.map((t) => (t.id === id ? { ...t, estado: nuevoEstado } : t)));
        } catch (error) {
            console.error("Error cambiando estado de ODS:", error);
            alert("No se pudo actualizar el estado de la ODS en PostgreSQL.");
        }
    };

    const tarjetasFiltradas = tarjetas.filter((t) => {
        if (esTecnico && !/Técnico/i.test(t.personal)) return false;
        const match = t.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
            t.vehiculo.toLowerCase().includes(busqueda.toLowerCase()) ||
            String(t.codigo).toLowerCase().includes(busqueda.toLowerCase());
        return match;
    });

    return (
        <div className="kanban-page">
            <div className="kanban-header">
                <div>
                    <h2>Tablero de Control Kanban</h2>
                    <p>{esTecnico ? "Tickets de servicio asignados a tu perfil técnico" : "Monitoreo en tiempo real del flujo operativo de órdenes de servicio."}</p>
                </div>

                <div className="kanban-search">
                    <span className="material-symbols-outlined">search</span>
                    <input
                        type="text"
                        placeholder="Buscar ticket, cliente o vehículo..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            <div className="kanban-board">
                {COLUMNAS.map((col) => {
                    const tarjetasEnCol = tarjetasFiltradas.filter((t) => t.estado === col.id);
                    return (
                        <div key={col.id} className="kanban-column">
                            <div className="column-header" style={{ borderTopColor: col.color }}>
                                <h3>{col.titulo}</h3>
                                <span className="col-count" style={{ background: col.color }}>{tarjetasEnCol.length}</span>
                            </div>

                            <div className="column-cards">
                                {tarjetasEnCol.length === 0 ? (
                                    <div className="empty-col">Sin órdenes</div>
                                ) : (
                                    tarjetasEnCol.map((card) => (
                                        <div key={card.id} className="kanban-card">
                                            <div className="card-top">
                                                <strong className="card-id">{card.codigo}</strong>
                                                <span className={`prio-tag ${card.prioridad.toLowerCase()}`}>{card.prioridad}</span>
                                            </div>

                                            <h4 className="card-client">{card.cliente}</h4>
                                            <p className="card-vehicle">🚗 {card.vehiculo}</p>
                                            <p className="card-reason">🔧 {card.motivo}</p>

                                            <div className="card-footer">
                                                <span className="card-tech">👤 {card.personal}</span>
                                                {/*<div className="card-actions">
                                                    {COLUMNAS.findIndex((c) => c.id === col.id) > 0 && (
                                                        <button className="btn-kanban-step" title="Mover al estado anterior" onClick={() => moverEstado(card.id, "atras")}>◀</button>
                                                    )}
                                                    {COLUMNAS.findIndex((c) => c.id === col.id) < COLUMNAS.length - 1 && (
                                                        <button className="btn-kanban-step" title="Avanzar al siguiente estado" onClick={() => moverEstado(card.id, "adelante")}>▶</button>
                                                    )}
                                                </div>*/}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Kanban;