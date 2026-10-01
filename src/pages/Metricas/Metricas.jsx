import { useEffect, useState } from "react";
import {
    obtenerDashboardMetricas,
    obtenerAsistenciaResumen,
    obtenerInventarioResumen,
    obtenerTecnicosDesempenio,
    obtenerVentasPorPeriodo,
} from "../../services/metricsService";
import "./Metricas.css";

const TABS = ["Principal", "Ventas", "Técnicos"];
const moneda = (valor) => Number(valor || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" });

function Metricas() {
    const [subtab, setSubtab] = useState("Principal");
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
        Promise.all([obtenerDashboardMetricas(), obtenerInventarioResumen(), obtenerTecnicosDesempenio(), obtenerAsistenciaResumen()])
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
    }, []);

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
            {error && <div className="metricas-error" role="alert">{error}</div>}
            <nav className="metricas-subnav" aria-label="Vistas de métricas">
                {TABS.map((tab) => <button key={tab} className={`metricas-tab-btn ${subtab === tab ? "active" : ""}`} type="button" onClick={() => setSubtab(tab)}>{tab}</button>)}
            </nav>
            {cargando ? <p>Consultando PostgreSQL…</p> : (
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
                        <section className="metricas-panel">
                            <h3>Ventas por periodo</h3>
                            <form className="metricas-period" onSubmit={consultarVentas}>
                                <label>Desde<input type="date" value={fechaDesde} onChange={(event) => setFechaDesde(event.target.value)} required /></label>
                                <label>Hasta<input type="date" value={fechaHasta} onChange={(event) => setFechaHasta(event.target.value)} required /></label>
                                <button type="submit" disabled={cargandoVentas}>{cargandoVentas ? "Consultando…" : "Consultar"}</button>
                            </form>
                            {ventas ? <div className="metricas-kpis">
                                <article><span>Facturas</span><strong>{ventas.cantidad_facturas}</strong></article>
                                <article><span>Total</span><strong>{moneda(ventas.total_ventas)}</strong></article>
                                <article><span>Promedio por factura</span><strong>{moneda(ventas.promedio_venta)}</strong></article>
                            </div> : <p>Selecciona las fechas del periodo que quieres consultar.</p>}
                        </section>
                    )}
                    {subtab === "Técnicos" && (
                        <section className="metricas-panel">
                            <h3>Actividad de técnicos</h3>
                            <div className="metricas-table-wrap"><table><thead><tr><th>Técnico</th><th>ODS</th><th>Completadas</th><th>Completación</th></tr></thead>
                                <tbody>{tecnicos.length ? tecnicos.map((tecnico) => <tr key={tecnico.tecnico_id}><td>{tecnico.nombre}</td><td>{tecnico.ods_totales}</td><td>{tecnico.ods_completadas}</td><td>{Number(tecnico.tasa_completacion || 0).toFixed(1)}%</td></tr>) : <tr><td colSpan="4">No hay actividad técnica registrada.</td></tr>}</tbody>
                            </table></div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

export default Metricas;
