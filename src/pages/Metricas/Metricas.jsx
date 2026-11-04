import { useEffect, useState } from "react";
import {
    obtenerDashboardMetricas,
    obtenerAsistenciaResumen,
    obtenerInventarioResumen,
    obtenerTecnicosDesempenio,
    obtenerVentasPorPeriodo,
} from "../../services/metricsService";
import { useRole } from "../../context/authContext";
import "./Metricas.css";

const TABS = ["Principal", "Ventas", "Técnicos"];
const moneda = (valor) => Number(valor || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" });

function Metricas() {
    const { rolActivo, ROLES } = useRole();
    const esTecnico = rolActivo === ROLES.TECNICO;
    // El servidor solo entrega a un técnico su propio desempeño, no datos de negocio.
    const pestanas = esTecnico ? ["Técnicos"] : TABS;

    const [subtab, setSubtab] = useState(esTecnico ? "Técnicos" : "Principal");
    const [dashboard, setDashboard] = useState(null);
    const [inventario, setInventario] = useState(null);
    const [asistencia, setAsistencia] = useState(null);
    const [tecnicos, setTecnicos] = useState([]);
    const [ventas, setVentas] = useState(null);
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [cargando, setCargando] = useState(true);
    const [cargandoVentas, setCargandoVentas] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let activa = true;
        const consultas = esTecnico
            ? [null, null, obtenerTecnicosDesempenio(), null]
            : [obtenerDashboardMetricas(), obtenerInventarioResumen(), obtenerTecnicosDesempenio(), obtenerAsistenciaResumen()];

        Promise.all(consultas)
            .then(([resumen, inventarioReal, tecnicosReales, asistenciaReal]) => {
                if (!activa) return;
                setDashboard(resumen);
                setInventario(inventarioReal);
                setTecnicos(tecnicosReales);
                setAsistencia(asistenciaReal);
            })
            .catch((loadError) => {
                if (activa) setError(loadError.message || "No se pudieron cargar las métricas.");
            })
            .finally(() => { if (activa) setCargando(false); });
        return () => { activa = false; };
    }, [esTecnico]);

    const consultarVentas = async (event) => {
        event.preventDefault();
        if (!fechaDesde || !fechaHasta || fechaDesde > fechaHasta) {
            setError("Selecciona un rango de fechas válido.");
            return;
        }
        setCargandoVentas(true);
        setError("");
        try {
            setVentas(await obtenerVentasPorPeriodo(fechaDesde, fechaHasta));
        } catch (loadError) {
            setError(loadError.message || "No se pudieron consultar las ventas.");
        } finally {
            setCargandoVentas(false);
        }
    };

    return (
        <div className="metricas-page">
            <header className="metricas-header">
                <div><h2>Métricas</h2><p>Indicadores consultados desde las tablas reales del sistema.</p></div>
            </header>
            {error && (
                <div className="vm-alert" role="alert">
                    <span className="material-symbols-outlined" aria-hidden="true">error</span>
                    {error}
                </div>
            )}
            <nav className="metricas-subnav" aria-label="Vistas de métricas">
                {pestanas.map((tab) => <button key={tab} className={`metricas-tab-btn ${subtab === tab ? "active" : ""}`} type="button" onClick={() => setSubtab(tab)}>{tab}</button>)}
            </nav>
            {cargando ? <p className="vm-loading">Consultando PostgreSQL…</p> : (
                <>
                    {subtab === "Principal" && (
                        <div className="metricas-kpis">
                            <article><span>Ventas últimos 30 días</span><strong>{moneda(dashboard?.ventas_totales)}</strong></article>
                            <article><span>ODS completadas</span><strong>{dashboard?.ods_completadas ?? 0}</strong></article>
                            <article><span>Stock bajo</span><strong>{dashboard?.items_stock_bajo ?? 0}</strong></article>
                            <article><span>Valor del inventario</span><strong>{moneda(inventario?.valor_inventario)}</strong></article>
                            <article><span>Ítems inventariados</span><strong>{inventario?.items_totales ?? 0}</strong></article>
                            <article><span>Asistencias del mes</span><strong>{asistencia?.total ?? 0}</strong></article>
                        </div>
                    )}
                    {subtab === "Ventas" && (
                        <section className="vm-card metricas-panel">
                            <div className="vm-card-head">
                                <h3>
                                    <span className="material-symbols-outlined" aria-hidden="true">point_of_sale</span>
                                    Ventas por periodo
                                </h3>
                            </div>
                            <form className="vm-filter-bar metricas-period" onSubmit={consultarVentas}>
                                <label className="filter-date">
                                    <span className="material-symbols-outlined filter-date-icon" aria-hidden="true">calendar_month</span>
                                    Desde
                                    <input type="date" value={fechaDesde} onChange={(event) => setFechaDesde(event.target.value)} required />
                                </label>
                                <label className="filter-date">
                                    <span className="material-symbols-outlined filter-date-icon" aria-hidden="true">event</span>
                                    Hasta
                                    <input type="date" value={fechaHasta} onChange={(event) => setFechaHasta(event.target.value)} required />
                                </label>
                                <button className="vm-btn vm-btn-accent" type="submit" disabled={cargandoVentas}>
                                    <span className="material-symbols-outlined" aria-hidden="true">search</span>
                                    {cargandoVentas ? "Consultando…" : "Consultar"}
                                </button>
                            </form>
                            <div className="vm-card-body">
                                {ventas ? <div className="metricas-kpis">
                                    <article><span>Facturas</span><strong>{ventas.cantidad_facturas}</strong></article>
                                    <article><span>Total</span><strong>{moneda(ventas.total_ventas)}</strong></article>
                                    <article><span>Promedio por factura</span><strong>{moneda(ventas.promedio_venta)}</strong></article>
                                </div> : (
                                    <p className="vm-empty">
                                        <span className="material-symbols-outlined" aria-hidden="true">date_range</span>
                                        Selecciona las fechas del periodo que quieres consultar.
                                    </p>
                                )}
                            </div>
                        </section>
                    )}
                    {subtab === "Técnicos" && (
                        <section className="vm-card metricas-panel">
                            <div className="vm-card-head">
                                <h3>
                                    <span className="material-symbols-outlined" aria-hidden="true">engineering</span>
                                    Actividad de técnicos
                                </h3>
                            </div>
                            <div className="metricas-table-wrap"><table className="vm-table"><thead><tr><th>Técnico</th><th className="vm-num">ODS</th><th className="vm-num">Completadas</th><th className="vm-num">Completación</th></tr></thead>
                                <tbody>{tecnicos.length ? tecnicos.map((tecnico) => (
                                    <tr key={tecnico.tecnico_id}>
                                        <td><strong>{tecnico.nombre}</strong></td>
                                        <td className="vm-num">{tecnico.ods_totales}</td>
                                        <td className="vm-num">{tecnico.ods_completadas}</td>
                                        <td className="vm-num">
                                            <span className="metricas-tasa">
                                                <span className="metricas-tasa-barra" aria-hidden="true">
                                                    <span className="metricas-tasa-relleno" style={{ width: `${Math.min(100, Math.max(0, Number(tecnico.tasa_completacion || 0)))}%` }} />
                                                </span>
                                                <span className="metricas-tasa-valor">{Number(tecnico.tasa_completacion || 0).toFixed(1)}%</span>
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4">
                                            <div className="vm-empty">
                                                <span className="material-symbols-outlined" aria-hidden="true">engineering</span>
                                                No hay actividad técnica registrada.
                                            </div>
                                        </td>
                                    </tr>
                                )}</tbody>
                            </table></div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

export default Metricas;
