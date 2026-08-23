import { useState } from "react";
import { useRole } from "../../context/RoleContext";
import "./Kanban.css";

const COLUMNAS = [
    { id: "Recepción", titulo: "Recepción", color: "#3b82f6" },
    { id: "Diagnóstico", titulo: "Diagnóstico", color: "#eab308" },
    { id: "Repuestos", titulo: "Repuestos", color: "#a855f7" },
    { id: "Aprobación", titulo: "Aprobación", color: "#06b6d4" },
    { id: "Reparación", titulo: "Reparación", color: "#f97316" },
    { id: "Control de Calidad", titulo: "Control Calidad", color: "#8b5cf6" },
    { id: "Entrega", titulo: "Entrega", color: "#22c55e" },
    { id: "Archivados", titulo: "Archivados", color: "#64748b" }
];

function Kanban() {
    const { rolActivo, ROLES } = useRole();
    const esTecnico = rolActivo === ROLES.TECNICO;

    const [busqueda, setBusqueda] = useState("");

    const [tarjetas, setTarjetas] = useState([
        { id: "ODS-1001", cliente: "Carlos Mendoza", vehiculo: "Toyota Corolla (ABC-123)", motivo: "Mantenimiento 80k km & frenos", personal: "Luis García", estado: "Recepción", prioridad: "Alta" },
        { id: "ODS-1002", cliente: "Elena Rojas", vehiculo: "Kia Sportage (DEF-789)", motivo: "Escaneo computarizado & inyección", personal: "Luis García", estado: "Diagnóstico", prioridad: "Urgente" },
        { id: "ODS-1003", cliente: "Talleres Industriales", vehiculo: "Toyota Hilux (GHI-321)", motivo: "Cambio de discos y pastillas", personal: "Pedro Ramírez", estado: "Repuestos", prioridad: "Normal" },
        { id: "ODS-1004", cliente: "Juan Pérez", vehiculo: "Ford Transit (XYZ-987)", motivo: "Alineación y balanceo", personal: "Luis García", estado: "Aprobación", prioridad: "Alta" },
        { id: "ODS-1005", cliente: "María Torres", vehiculo: "Hyundai Tucson (JKL-654)", motivo: "Reparación de cremallera hidráulica", personal: "Pedro Ramírez", estado: "Reparación", prioridad: "Urgente" },
        { id: "ODS-1006", cliente: "Roberto Gomez", vehiculo: "Nissan Frontier (MNO-456)", motivo: "Control de calidad final", personal: "Jorge Salazar", estado: "Control de Calidad", prioridad: "Normal" },
        { id: "ODS-1007", cliente: "Lucía Fernández", vehiculo: "Honda CR-V (PQR-111)", motivo: "Mantenimiento preventivo", personal: "Luis García", estado: "Entrega", prioridad: "Normal" },
    ]);

    const moverEstado = (id, direccion) => {
        setTarjetas(prev => prev.map(t => {
            if (t.id === id) {
                const idxActual = COLUMNAS.findIndex(c => c.id === t.estado);
                const nuevoIdx = direccion === "adelante" ? idxActual + 1 : idxActual - 1;
                if (nuevoIdx >= 0 && nuevoIdx < COLUMNAS.length) {
                    return { ...t, estado: COLUMNAS[nuevoIdx].id };
                }
            }
            return t;
        }));
    };

    const tarjetasFiltradas = tarjetas.filter(t => {
        if (esTecnico && t.personal !== "Luis García") return false; // Filtro para vista de técnico
        const match = t.cliente.toLowerCase().includes(busqueda.toLowerCase()) || 
                      t.vehiculo.toLowerCase().includes(busqueda.toLowerCase()) ||
                      t.id.toLowerCase().includes(busqueda.toLowerCase());
        return match;
    });

    return (
        <div className="kanban-page">

            {/* CABECERA */}
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

            {/* TABLERO KANBAN DE COLUMNAS */}
            <div className="kanban-board">
                {COLUMNAS.map(col => {
                    const tarjetasEnCol = tarjetasFiltradas.filter(t => t.estado === col.id);
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
                                    tarjetasEnCol.map(card => (
                                        <div key={card.id} className="kanban-card">
                                            <div className="card-top">
                                                <strong className="card-id">{card.id}</strong>
                                                <span className={`prio-tag ${card.prioridad.toLowerCase()}`}>{card.prioridad}</span>
                                            </div>

                                            <h4 className="card-client">{card.cliente}</h4>
                                            <p className="card-vehicle">🚗 {card.vehiculo}</p>
                                            <p className="card-reason">🔧 {card.motivo}</p>

                                            <div className="card-footer">
                                                <span className="card-tech">👤 {card.personal}</span>
                                                <div className="card-actions">
                                                    {COLUMNAS.findIndex(c => c.id === col.id) > 0 && (
                                                        <button 
                                                            className="btn-kanban-step" 
                                                            title="Mover al estado anterior"
                                                            onClick={() => moverEstado(card.id, "atras")}
                                                        >
                                                            ◀
                                                        </button>
                                                    )}
                                                    {COLUMNAS.findIndex(c => c.id === col.id) < COLUMNAS.length - 1 && (
                                                        <button 
                                                            className="btn-kanban-step" 
                                                            title="Avanzar al siguiente estado"
                                                            onClick={() => moverEstado(card.id, "adelante")}
                                                        >
                                                            ▶
                                                        </button>
                                                    )}
                                                </div>
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