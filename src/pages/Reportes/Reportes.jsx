import { useEffect, useMemo, useState } from "react";
import {
    obtenerDashboardMetricas,
    obtenerInventarioResumen,
    obtenerTecnicosDesempenio,
    obtenerVentasPorPeriodo,
} from "../../services/metricsService";
import "./Reportes.css";

const TABS = ["Resumen", "Ventas", "Inventario", "Técnicos"];
const moneda = (valor) => Number(valor || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" });

function Reportes() {
    const [submodulo, setSubmodulo] = useState("Resumen");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [tecnicoFiltro, setTecnicoFiltro] = useState("Todos");
    const [dashboard, setDashboard] = useState(null);
    const [inventario, setInventario] = useState(null);
    const [tecnicos, setTecnicos] = useState([]);
    const [ventasPeriodo, setVentasPeriodo] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [cargandoVentas, setCargandoVentas] = useState(false);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        let activa = true;
        Promise.all([
            obtenerDashboardMetricas(),
            obtenerInventarioResumen(),
            obtenerTecnicosDesempenio(),
        ])
            .then(([resumen, inventarioReal, tecnicosReales]) => {
                if (!activa) return;
                setDashboard(resumen);
                setInventario(inventarioReal);
                setTecnicos(tecnicosReales);
            })
            .catch((loadError) => {
                if (activa) setError(loadError.message || "No se pudieron cargar los reportes.");
            })
            .finally(() => {
                if (activa) setCargando(false);
            });
        return () => { activa = false; };
    }, [revision]);

    const tecnicosFiltrados = useMemo(() => (
        tecnicoFiltro === "Todos" ? tecnicos : tecnicos.filter((tecnico) => String(tecnico.tecnico_id) === tecnicoFiltro)
    ), [tecnicoFiltro, tecnicos]);

    const aplicarFiltroVentas = async (event) => {
        event.preventDefault();
        if (!fechaDesde || !fechaHasta || fechaDesde > fechaHasta) {
            setError("Selecciona un rango de fechas válido.");
            return;
        }
        setError("");
        setCargandoVentas(true);
        try {
            setVentasPeriodo(await obtenerVentasPorPeriodo(fechaDesde, fechaHasta));
        } catch (loadError) {
            setError(loadError.message || "No se pudo consultar el periodo.");
        } finally {
            setCargandoVentas(false);
        }
    };

    return (
        <div className="reportes-page">
            <div className="reportes-header">
                <div>
                    <h2>Reportes</h2>
                    <p>Indicadores calculados desde facturas, inventario, ODS y usuarios de PostgreSQL.</p>
                </div>
                <button className="btn-act-table link" type="button" onClick={() => setRevision((valor) => valor + 1)} disabled={cargando}>Actualizar</button>
            </div>

            {error && <div className="reportes-error" role="alert">{error}</div>}
            <div className="reportes-tabs-nav">
                {TABS.map((tab) => (
                    <button key={tab} className={`reportes-tab-btn ${submodulo === tab ? "active" : ""}`} onClick={() => setSubmodulo(tab)} type="button">{tab}</button>
                ))}
            </div>

            {cargando ? <p>Consultando PostgreSQL…</p> : (
                <>
                    {submodulo === "Resumen" && (
                        <div className="reportes-card-grid">
                            <div className="reporte-stat-box"><span>Ventas últimos 30 días</span><h3>{moneda(dashboard?.ventas_totales)}</h3></div>
                            <div className="reporte-stat-box"><span>ODS completadas</span><h3>{dashboard?.ods_completadas ?? 0}</h3></div>
                            <div className="reporte-stat-box"><span>Ítems con stock bajo</span><h3>{dashboard?.items_stock_bajo ?? 0}</h3></div>
                            <div className="reporte-stat-box"><span>Valor de inventario</span><h3>{moneda(dashboard?.valor_inventario)}</h3></div>
                        </div>
                    )}

                    {submodulo === "Ventas" && (
                        <section className="reporte-chart-section">
                            <h3>Ventas por periodo</h3>
                            <form className="reportes-filter-bar" onSubmit={aplicarFiltroVentas}>
                                <label className="reportes-filter-item">Desde<input type="date" value={fechaDesde} onChange={(event) => setFechaDesde(event.target.value)} required /></label>
                                <label className="reportes-filter-item">Hasta<input type="date" value={fechaHasta} onChange={(event) => setFechaHasta(event.target.value)} required /></label>
                                <button className="btn-act-table link" type="submit" disabled={cargandoVentas}>{cargandoVentas ? "Consultando…" : "Consultar"}</button>
                            </form>
                            {ventasPeriodo ? (
                                <div className="reportes-card-grid">
                                    <div className="reporte-stat-box"><span>Facturas del periodo</span><h3>{ventasPeriodo.cantidad_facturas}</h3></div>
                                    <div className="reporte-stat-box"><span>Total facturado</span><h3>{moneda(ventasPeriodo.total_ventas)}</h3></div>
                                    <div className="reporte-stat-box"><span>Promedio por factura</span><h3>{moneda(ventasPeriodo.promedio_venta)}</h3></div>
                                </div>
                            ) : <p>Selecciona fechas para consultar las facturas reales del periodo.</p>}
                        </section>
                    )}

                    {submodulo === "Inventario" && (
                        <div className="reportes-card-grid">
                            <div className="reporte-stat-box"><span>Ítems registrados</span><h3>{inventario?.items_totales ?? 0}</h3></div>
                            <div className="reporte-stat-box"><span>Ítems con stock bajo</span><h3>{inventario?.items_stock_bajo ?? 0}</h3></div>
                            <div className="reporte-stat-box"><span>Valor de inventario</span><h3>{moneda(inventario?.valor_inventario)}</h3></div>
                            <div className="reporte-stat-box"><span>Porcentaje bajo mínimo</span><h3>{Number(inventario?.porcentaje_bajo || 0).toFixed(1)}%</h3></div>
                        </div>
                    )}

                    {submodulo === "Técnicos" && (
                        <section className="reporte-chart-section">
                            <div className="reportes-filter-item">
                                <label htmlFor="reporte-tecnico">Técnico</label>
                                <select id="reporte-tecnico" value={tecnicoFiltro} onChange={(event) => setTecnicoFiltro(event.target.value)}>
                                    <option value="Todos">Todos</option>
                                    {tecnicos.map((tecnico) => <option key={tecnico.tecnico_id} value={tecnico.tecnico_id}>{tecnico.nombre}</option>)}
                                </select>
                            </div>
                            <div className="os-table-wrapper">
                                <table className="os-table">
                                    <thead><tr><th>Técnico</th><th>ODS atendidas</th><th>ODS completadas</th><th>Tasa de completación</th></tr></thead>
                                    <tbody>{tecnicosFiltrados.length ? tecnicosFiltrados.map((tecnico) => (
                                        <tr key={tecnico.tecnico_id}><td>{tecnico.nombre}</td><td>{tecnico.ods_totales}</td><td>{tecnico.ods_completadas}</td><td>{Number(tecnico.tasa_completacion || 0).toFixed(1)}%</td></tr>
                                    )) : <tr><td colSpan="4">No hay técnicos o actividad registrada.</td></tr>}</tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

export default Reportes;
