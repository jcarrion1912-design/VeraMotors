import { useEffect, useState } from "react";
import "./Dashboard.css";
import { obtenerDashboardMetricas } from "../../services/metricsService";
import { obtenerODS } from "../../services/odsService";
import { obtenerCitas } from "../../services/citaService";

function Dashboard() {
    const [metricas, setMetricas] = useState({
        ventas_totales: 0,
        ods_completadas: 0,
        items_stock_bajo: 0,
        valor_inventario: 0
    });
    const [serviciosRecientes, setServiciosRecientes] = useState([]);
    const [proximasCitas, setProximasCitas] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [dashboard, ods, citas] = await Promise.all([
                    obtenerDashboardMetricas(),
                    obtenerODS(),
                    obtenerCitas()
                ]);

                setMetricas(dashboard || {});

                const servicios = Array.isArray(ods)
                    ? ods.slice(0, 5).map((item) => ({
                        placa: item.vehiculo_placa || "Sin placa",
                        modelo: item.cliente_nombre || "Cliente",
                        servicio: item.tipo_procedimiento || "Servicio general",
                        estado: item.estado_actual || "Pendiente",
                        prioridad: item.estado_actual === "Completado" ? "Normal" : item.estado_actual === "En Reparación" ? "Alta" : "Normal"
                    }))
                    : [];

                setServiciosRecientes(servicios);

                const citasOrdenadas = Array.isArray(citas)
                    ? [...citas].sort((a, b) => new Date(a.fecha_hora_inicio) - new Date(b.fecha_hora_inicio)).slice(0, 4)
                    : [];

                setProximasCitas(citasOrdenadas);
            } catch (error) {
                console.error("Error cargando dashboard:", error);
            }
        };

        cargarDatos();
    }, []);

    const vehiculosEnTaller = Math.max(1, serviciosRecientes.length || 1);
    const citasHoy = proximasCitas.length;
    const ingresosMes = Number(metricas.ventas_totales || 0);
    const alertasStock = Number(metricas.items_stock_bajo || 0);

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Resumen del Taller</h1>
                    <p>Vista general operativa de hoy</p>
                </div>
                <button className="report-button">
                    <span>⇩</span>
                    Reporte
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-top">
                        <span>Vehículos en taller</span>
                        <div className="stat-icon blue">🚗</div>
                    </div>
                    <div className="stat-value">{vehiculosEnTaller}</div>
                    <div className="stat-description positive">↑ +2<span>vs ayer</span></div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-top">
                        <span>Citas hoy</span>
                        <div className="stat-icon dark">📅</div>
                    </div>
                    <div className="stat-value-row">
                        <div className="stat-value">{citasHoy}</div>
                        <span className="capacity">/ 10 cap.</span>
                    </div>
                    <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${Math.min(citasHoy * 10, 100)}%` }}></div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-top">
                        <span>Ingresos mes</span>
                        <div className="stat-icon green">💰</div>
                    </div>
                    <div className="stat-value">S/ {ingresosMes.toLocaleString("es-PE", { maximumFractionDigits: 0 })}</div>
                    <div className="stat-description positive green-text">↑ +12%<span>vs mes anterior</span></div>
                </div>

                <div className="stat-card alert-card">
                    <div className="stat-card-top">
                        <span>Alertas stock</span>
                        <div className="stat-icon red">⚠</div>
                    </div>
                    <div className="stat-value alert-value">{alertasStock}</div>
                    <div className="stat-description alert-text">Items críticos<span className="detail-link">Ver detalle</span></div>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="services-card">
                    <div className="section-header">
                        <h2><span className="section-icon">🔧</span>Servicios Recientes</h2>
                        <button className="view-all">Ver todos</button>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Placa / Modelo</th>
                                    <th>Servicio</th>
                                    <th>Estado</th>
                                    <th>Prioridad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serviciosRecientes.length > 0 ? serviciosRecientes.map((item, index) => (
                                    <tr key={`${item.placa}-${index}`}>
                                        <td>
                                            <div className="plate">{item.placa}</div>
                                            <div className="vehicle">{item.modelo}</div>
                                        </td>
                                        <td>{item.servicio}</td>
                                        <td>
                                            <span className={`status ${item.estado === "Completado" ? "completed" : item.estado === "Pendiente" ? "pending" : "progress"}`}>
                                                <span></span>
                                                {item.estado}
                                            </span>
                                        </td>
                                        <td className={`priority ${item.prioridad === "Alta" ? "high" : item.prioridad === "Normal" ? "normal" : "medium"}`}>
                                            {item.prioridad === "Alta" ? "↑↑" : item.prioridad === "Normal" ? "—" : "↑"}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4">No hay servicios recientes.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="appointments-card">
                    <div className="section-header">
                        <h2><span className="section-icon">📅</span>Próximas Citas</h2>
                    </div>

                    <div className="appointments-list">
                        {proximasCitas.length > 0 ? proximasCitas.map((cita) => {
                            const fecha = new Date(cita.fecha_hora_inicio);
                            const hora = fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
                            const label = fecha.toLocaleDateString("es-PE", { weekday: "short" }).toUpperCase();

                            return (
                                <div key={cita.cita_id} className="appointment">
                                    <div className="appointment-time">
                                        <span>{label}</span>
                                        <strong>{hora}</strong>
                                    </div>
                                    <div className="appointment-info">
                                        <h3>{cita.cliente_nombre || "Cliente"}</h3>
                                        <p>{cita.observaciones || "Servicio programado"} • {cita.vehiculo_placa || "Sin vehículo"}</p>
                                    </div>
                                    <button className="more-button">⋮</button>
                                </div>
                            );
                        }) : (
                            <div className="appointment">
                                <div className="appointment-info">
                                    <h3>No hay citas registradas</h3>
                                    <p>Cuando existan citas se mostrarán aquí.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="calendar-footer">
                        <button>Ver Calendario Completo</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;