import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
    obtenerDashboardMetricas,
    obtenerTecnicosDesempenio,
    obtenerVentasPorPeriodo,
} from "../../services/metricsService";
import { obtenerODS } from "../../services/odsService";
import { obtenerCitas } from "../../services/citaService";
import { ETAPAS_TALLER, normalizarEstado } from "../../config/flujoTaller";
import { VehicleSilhouette } from "../../components/Brand/Brand";
import Tacometro from "./Tacometro";
import ColumnasMensuales from "./ColumnasMensuales";

const MESES_ATRAS = 6;
const ESTADOS_CERRADOS = ["Archivados", "Archivado"];
const ETAPAS_EN_PROCESO = ["Diagnóstico", "Repuestos", "Aprobación", "Reparación", "Control de Calidad"];

const pad = (n) => String(n).padStart(2, "0");
const isoFecha = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const rangoMeses = () => {
    const hoy = new Date();
    return Array.from({ length: MESES_ATRAS }, (_, i) => {
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - (MESES_ATRAS - 1 - i), 1);
        const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
        return {
            clave: isoFecha(inicio),
            desde: isoFecha(inicio),
            hasta: isoFecha(fin),
            etiqueta: inicio.toLocaleDateString("es-PE", { month: "short" }).replace(".", ""),
            etiquetaLarga: inicio.toLocaleDateString("es-PE", { month: "long", year: "numeric" }),
        };
    });
};

const claseEstado = (etapa) => {
    if (etapa === "Entrega") return "vm-badge-success";
    if (etapa === "Recepción") return "vm-badge-info";
    if (etapa === "Repuestos" || etapa === "Aprobación") return "vm-badge-warning";
    return "vm-badge-accent";
};

const tiempoRelativo = (valor, ahora) => {
    if (!valor) return "";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "";
    const dias = Math.floor((ahora - fecha.getTime()) / 86400000);
    if (dias <= 0) return "Hoy";
    if (dias === 1) return "Ayer";
    if (dias < 30) return `Hace ${dias} días`;
    return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
};

const moneda = (v) => `S/ ${Number(v || 0).toLocaleString("es-PE", { maximumFractionDigits: 0 })}`;

function Lectura({ icono, etiqueta, valor, nota, destacado }) {
    return (
        <div className={`dash-lectura ${destacado ? "is-accent" : ""}`}>
            <span className="dash-lectura-etiqueta">
                <span className="material-symbols-outlined">{icono}</span>
                {etiqueta}
            </span>
            <strong className="dash-lectura-valor">{valor}</strong>
            <span className="dash-lectura-nota">{nota}</span>
        </div>
    );
}

function Dashboard() {
    const navigate = useNavigate();

    const [ahora] = useState(() => Date.now());
    const [cargando, setCargando] = useState(true);
    const [fallos, setFallos] = useState(0);
    const [metricas, setMetricas] = useState({});
    const [ods, setOds] = useState([]);
    const [citas, setCitas] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);
    const [ventasMes, setVentasMes] = useState([]);

    useEffect(() => {
        let activo = true;
        const meses = rangoMeses();

        Promise.allSettled([
            obtenerDashboardMetricas(),
            obtenerODS(),
            obtenerCitas(),
            obtenerTecnicosDesempenio(),
            Promise.all(meses.map((m) => obtenerVentasPorPeriodo(m.desde, m.hasta))),
        ]).then(([rMetricas, rOds, rCitas, rTecnicos, rVentas]) => {
            if (!activo) return;

            const resultados = [rMetricas, rOds, rCitas, rTecnicos, rVentas];
            resultados.filter((r) => r.status === "rejected").forEach((r) => {
                console.error("Error cargando dashboard:", r.reason);
            });
            setFallos(resultados.filter((r) => r.status === "rejected").length);

            if (rMetricas.status === "fulfilled") setMetricas(rMetricas.value || {});
            if (rOds.status === "fulfilled" && Array.isArray(rOds.value)) setOds(rOds.value);
            if (rCitas.status === "fulfilled" && Array.isArray(rCitas.value)) setCitas(rCitas.value);
            if (rTecnicos.status === "fulfilled" && Array.isArray(rTecnicos.value)) setTecnicos(rTecnicos.value);
            if (rVentas.status === "fulfilled") {
                setVentasMes(meses.map((m, i) => ({
                    ...m,
                    total: Number(rVentas.value[i]?.total_ventas || 0),
                    cantidad: Number(rVentas.value[i]?.cantidad_facturas || 0),
                })));
            }
            setCargando(false);
        });

        return () => { activo = false; };
    }, []);

    // ==========================================
    // DERIVADOS
    // ==========================================
    const odsAbiertas = useMemo(
        () => ods.filter((o) => !ESTADOS_CERRADOS.includes(o.estado_actual)),
        [ods]
    );

    const porEtapa = useMemo(() => {
        const conteo = Object.fromEntries(ETAPAS_TALLER.map((e) => [e.id, 0]));
        odsAbiertas.forEach((o) => {
            const etapa = normalizarEstado(o.estado_actual);
            if (etapa in conteo) conteo[etapa] += 1;
        });
        return conteo;
    }, [odsAbiertas]);

    const maxEtapa = Math.max(1, ...Object.values(porEtapa));
    const enProceso = ETAPAS_EN_PROCESO.reduce((t, e) => t + (porEtapa[e] || 0), 0);
    const pendientesRecepcion = porEtapa["Recepción"] || 0;

    const vehiculosEnTaller = Number(metricas.ods_en_taller || 0);
    const finalizados = Number(metricas.ods_completadas || 0);
    const citasHoy = Number(metricas.citas_hoy || 0);
    const ingresos = Number(metricas.ventas_totales || 0);
    const alertasStock = Number(metricas.items_stock_bajo || 0);
    const baseProductividad = finalizados + vehiculosEnTaller;
    const productividad = baseProductividad > 0 ? (finalizados / baseProductividad) * 100 : 0;

    const tecnicosEstado = useMemo(() => tecnicos.map((t) => {
        const asignadas = odsAbiertas.filter((o) =>
            Number(o.tecnico_id) === Number(t.tecnico_id) &&
            ETAPAS_EN_PROCESO.includes(normalizarEstado(o.estado_actual))
        ).length;
        return { ...t, asignadas };
    }).sort((a, b) => b.asignadas - a.asignadas), [tecnicos, odsAbiertas]);

    const actividad = useMemo(() => [...ods]
        .sort((a, b) => new Date(b.fecha_ingreso || 0) - new Date(a.fecha_ingreso || 0))
        .slice(0, 6), [ods]);

    const proximasCitas = useMemo(() => citas
        .filter((c) => c.estado !== "Anulada" && new Date(c.fecha_hora_inicio).getTime() >= ahora)
        .sort((a, b) => new Date(a.fecha_hora_inicio) - new Date(b.fecha_hora_inicio))
        .slice(0, 5), [citas, ahora]);

    const fechaLarga = new Date(ahora).toLocaleDateString("es-PE", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    return (
        <div className="dashboard">

            <div className="vm-page-head">
                <div>
                    <h1>Centro de control del taller</h1>
                    <p className="dash-fecha">{fechaLarga}</p>
                </div>
                <button className="vm-btn vm-btn-secondary" type="button" onClick={() => navigate("/reportes")}>
                    <span className="material-symbols-outlined">summarize</span>
                    Ver reportes
                </button>
            </div>

            {fallos > 0 && (
                <div className="vm-alert" role="alert">
                    <span className="material-symbols-outlined">error</span>
                    <span>
                        No se pudo cargar parte de la información ({fallos} de 5 consultas).
                        Revisa la conexión con el servidor; los valores afectados aparecen en cero.
                    </span>
                </div>
            )}

            {/* =================================================
                TABLERO DE INSTRUMENTOS
            ================================================= */}
            <section className={`dash-cluster ${cargando ? "is-loading" : ""}`} aria-label="Indicadores principales">
                <VehicleSilhouette className="dash-cluster-auto" />

                <div className="dash-cluster-gauge">
                    <Tacometro valor={productividad} etiqueta="Productividad" />
                    <p>Órdenes finalizadas sobre el total registrado</p>
                </div>

                <div className="dash-cluster-lecturas">
                    <Lectura icono="directions_car" etiqueta="Vehículos en servicio" valor={vehiculosEnTaller} nota="Órdenes sin cerrar" destacado />
                    <Lectura icono="car_repair" etiqueta="OT en proceso" valor={enProceso} nota="De diagnóstico a calidad" />
                    <Lectura icono="garage_home" etiqueta="Pendientes de recepción" valor={pendientesRecepcion} nota="Por iniciar diagnóstico" />
                    <Lectura icono="task_alt" etiqueta="Servicios finalizados" valor={finalizados} nota="Acumulado histórico" />
                </div>

                <div className="dash-cluster-lado">
                    <div className="dash-ingreso">
                        <span>Cobros · últimos 30 días</span>
                        <strong>{moneda(ingresos)}</strong>
                    </div>
                    <Link to="/citas" className="dash-chip">
                        <span className="material-symbols-outlined">calendar_month</span>
                        <span className="dash-chip-texto">Citas hoy</span>
                        <strong>{citasHoy}</strong>
                    </Link>
                    <Link to="/inventario" className={`dash-chip ${alertasStock > 0 ? "is-alerta" : ""}`}>
                        <span className="material-symbols-outlined">warning</span>
                        <span className="dash-chip-texto">Alertas de stock</span>
                        <strong>{alertasStock}</strong>
                    </Link>
                </div>
            </section>

            {/* =================================================
                FLUJO DE SERVICIO
            ================================================= */}
            <section className="vm-card dash-flujo">
                <div className="vm-card-head">
                    <h2><span className="material-symbols-outlined">route</span>Flujo de servicio</h2>
                    <Link className="dash-link" to="/kanban">Abrir tablero</Link>
                </div>
                <ol className="dash-etapas">
                    {ETAPAS_TALLER.map((etapa) => {
                        const cantidad = porEtapa[etapa.id] || 0;
                        return (
                            <li key={etapa.id} className={`dash-etapa ${cantidad > 0 ? "has-items" : ""}`}>
                                <span className="dash-etapa-nodo">
                                    <span className="material-symbols-outlined">{etapa.icono}</span>
                                </span>
                                <strong>{cantidad}</strong>
                                <span className="dash-etapa-nombre">{etapa.titulo}</span>
                                <span className="dash-etapa-barra" aria-hidden="true">
                                    <span style={{ width: `${(cantidad / maxEtapa) * 100}%` }} />
                                </span>
                            </li>
                        );
                    })}
                </ol>
            </section>

            <div className="dash-grid">

                {/* FACTURACIÓN */}
                <section className="vm-card">
                    <div className="vm-card-head">
                        <h2><span className="material-symbols-outlined">bar_chart</span>Facturación mensual</h2>
                        <span className="dash-card-nota">Últimos {MESES_ATRAS} meses · S/</span>
                    </div>
                    <div className="vm-card-body">
                        {cargando ? <span className="vm-skeleton dash-sk-chart" /> : <ColumnasMensuales datos={ventasMes} />}
                    </div>
                </section>

                {/* TÉCNICOS */}
                <section className="vm-card">
                    <div className="vm-card-head">
                        <h2><span className="material-symbols-outlined">engineering</span>Estado de técnicos</h2>
                        <span className="dash-card-nota">Tasa de completación</span>
                    </div>
                    {tecnicosEstado.length > 0 ? (
                        <ul className="dash-tecnicos">
                            {tecnicosEstado.slice(0, 6).map((t) => {
                                const tasa = Number(t.tasa_completacion || 0);
                                return (
                                    <li key={t.tecnico_id}>
                                        <span className="dash-tecnico-avatar">{String(t.nombre || "T").substring(0, 2).toUpperCase()}</span>
                                        <div className="dash-tecnico-info">
                                            <strong>{t.nombre}</strong>
                                            <span className={`vm-badge ${t.asignadas > 0 ? "vm-badge-accent" : "vm-badge-success"}`}>
                                                {t.asignadas > 0 ? `En servicio · ${t.asignadas} OT` : "Disponible"}
                                            </span>
                                        </div>
                                        <div className="dash-tecnico-tasa">
                                            <strong>{tasa.toFixed(0)}%</strong>
                                            <span className="dash-tecnico-barra" aria-hidden="true">
                                                <span style={{ width: `${Math.min(tasa, 100)}%` }} />
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="vm-empty">
                            <span className="material-symbols-outlined">engineering</span>
                            <span>{cargando ? "Consultando técnicos…" : "No hay técnicos activos registrados."}</span>
                        </div>
                    )}
                </section>

                {/* ACTIVIDAD */}
                <section className="vm-card">
                    <div className="vm-card-head">
                        <h2><span className="material-symbols-outlined">build</span>Actividad reciente</h2>
                        <Link className="dash-link" to="/ordenes-servicio">Ver todas</Link>
                    </div>
                    {actividad.length > 0 ? (
                        <div className="dash-tabla">
                            <table className="vm-table">
                                <thead>
                                    <tr>
                                        <th>Vehículo</th>
                                        <th>Servicio</th>
                                        <th>Estado</th>
                                        <th>Ingreso</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {actividad.map((o) => {
                                        const etapa = normalizarEstado(o.estado_actual);
                                        return (
                                            <tr key={o.ods_id}>
                                                <td>
                                                    <div className="dash-vehiculo">
                                                        <span className="vm-plate">{o.vehiculo_placa || "S/ PLACA"}</span>
                                                        <span>{o.cliente_nombre || "Cliente"}</span>
                                                    </div>
                                                </td>
                                                <td>{o.tipo_procedimiento || "Servicio general"}</td>
                                                <td><span className={`vm-badge ${claseEstado(etapa)}`}>{o.estado_actual || "Pendiente"}</span></td>
                                                <td className="dash-fecha-celda">{tiempoRelativo(o.fecha_ingreso, ahora)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="vm-empty">
                            <span className="material-symbols-outlined">build</span>
                            <span>{cargando ? "Consultando órdenes…" : "No hay servicios recientes."}</span>
                        </div>
                    )}
                </section>

                {/* CITAS */}
                <section className="vm-card">
                    <div className="vm-card-head">
                        <h2><span className="material-symbols-outlined">event_upcoming</span>Próximas citas</h2>
                        <Link className="dash-link" to="/citas">Ver calendario</Link>
                    </div>
                    {proximasCitas.length > 0 ? (
                        <ul className="dash-citas">
                            {proximasCitas.map((cita) => {
                                const fecha = new Date(cita.fecha_hora_inicio);
                                return (
                                    <li key={cita.cita_id}>
                                        <Link to="/citas" className="dash-cita">
                                            <span className="dash-cita-hora">
                                                <span>{fecha.toLocaleDateString("es-PE", { weekday: "short", day: "numeric" }).replace(",", "")}</span>
                                                <strong>{fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false })}</strong>
                                            </span>
                                            <span className="dash-cita-info">
                                                <strong>{cita.cliente_nombre || "Cliente"}</strong>
                                                <span>{cita.observaciones || "Servicio programado"}</span>
                                            </span>
                                            {cita.vehiculo_placa && <span className="vm-plate">{cita.vehiculo_placa}</span>}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="vm-empty">
                            <span className="material-symbols-outlined">event_available</span>
                            <span>{cargando ? "Consultando citas…" : "No hay citas próximas."}</span>
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}

export default Dashboard;
