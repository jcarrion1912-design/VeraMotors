import { useState } from "react";
import "./Reportes.css";

function Reportes() {
    const [submodulo, setSubmodulo] = useState("Ventas Generales");
    const [subOperaciones, setSubOperaciones] = useState("Rentabilidad");

    // Filtros avanzados
    const [fechaDesde, setFechaDesde] = useState("2026-08-01");
    const [fechaHasta, setFechaHasta] = useState("2026-08-31");
    const [tecnicoFiltro, setTecnicoFiltro] = useState("Todos");
    const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");

    // Datos simulados: Ventas por Ítems
    const ventasItemsData = [
        { codigo: "BRK-892-C", nombre: "Pastillas de Freno Brembo", categoria: "Frenos", cantidad: 48, costoTotal: 2640.00, ventaTotal: 4080.00, margen: "35.3%" },
        { codigo: "ENG-SP-441", nombre: "Bujías NGK Iridium", categoria: "Motor", cantidad: 96, costoTotal: 768.00, ventaTotal: 1200.00, margen: "36.0%" },
        { codigo: "KIT-OIL-5W30", nombre: "Kit Cambio Aceite Mobil1", categoria: "Mantenimiento", cantidad: 32, costoTotal: 2880.00, ventaTotal: 4640.00, margen: "37.9%" },
        { codigo: "SRV-DIAG-01", nombre: "Servicio Escáner y Diagnóstico", categoria: "Servicios", cantidad: 25, costoTotal: 750.00, ventaTotal: 3000.00, margen: "75.0%" },
        { codigo: "BRK-ROT-88", nombre: "Disco de Freno Bosch", categoria: "Frenos", cantidad: 18, costoTotal: 756.00, ventaTotal: 1170.00, margen: "35.4%" },
    ];

    // Datos simulados: Rentabilidad por ODS
    const rentabilidadODSData = [
        { ods: "ODS-1001", cliente: "Carlos Mendoza", tecnico: "Luis García", manoObra: 350.00, repuestos: 160.00, terceros: 0.00, costoDirecto: 280.00, ventaTotal: 510.00, utilidad: 230.00, margen: "45.1%" },
        { ods: "ODS-1002", cliente: "Elena Rojas", tecnico: "Luis García", manoObra: 450.00, repuestos: 400.00, terceros: 0.00, costoDirecto: 480.00, ventaTotal: 850.00, utilidad: 370.00, margen: "43.5%" },
        { ods: "ODS-1003", cliente: "Talleres Industriales S.A.", tecnico: "Pedro Ramírez", manoObra: 950.00, repuestos: 1200.00, terceros: 300.00, costoDirecto: 1450.00, ventaTotal: 2450.00, utilidad: 1000.00, margen: "40.8%" },
        { ods: "ODS-1004", cliente: "Juan Pérez", tecnico: "Luis García", manoObra: 250.00, repuestos: 100.00, terceros: 0.00, costoDirecto: 180.00, ventaTotal: 350.00, utilidad: 170.00, margen: "48.5%" },
    ];

    // Datos simulados: Rendimiento por Técnico
    const tecnicosData = [
        { nombre: "Luis García", especialidad: "Diagnóstico & Frenos", odsAtendidas: 28, hhEstimadas: 65, hhProducidas: 72, eficiencia: "110.7%", satisfaccion: "96%" },
        { nombre: "Pedro Ramírez", especialidad: "Motor & Transmisión", odsAtendidas: 22, hhEstimadas: 58, hhProducidas: 60, eficiencia: "103.4%", satisfaccion: "94%" },
        { nombre: "Jorge Salazar", especialidad: "Electricidad & Sistema", odsAtendidas: 19, hhEstimadas: 45, hhProducidas: 48, eficiencia: "106.6%", satisfaccion: "92%" },
    ];

    return (
        <div className="reportes-page">

            {/* CABECERA */}
            <div className="reportes-header">
                <div>
                    <h2>Reportes Generales y Analíticos</h2>
                    <p>Reportes de Ventas Generales, Ventas por Ítems y Operaciones Taller de VeraMotors SAC.</p>
                </div>
            </div>

            {/* BARRA DE FILTROS AVANZADOS */}
            <div className="reportes-filter-bar">
                <div className="reportes-filter-item">
                    <label>Desde:</label>
                    <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                </div>

                <div className="reportes-filter-item">
                    <label>Hasta:</label>
                    <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                </div>

                <div className="reportes-filter-item">
                    <label>Técnico:</label>
                    <select value={tecnicoFiltro} onChange={(e) => setTecnicoFiltro(e.target.value)}>
                        <option value="Todos">Todos los Técnicos</option>
                        <option value="Luis García">Luis García</option>
                        <option value="Pedro Ramírez">Pedro Ramírez</option>
                        <option value="Jorge Salazar">Jorge Salazar</option>
                    </select>
                </div>

                <div className="reportes-filter-item">
                    <label>Categoría Ítem:</label>
                    <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                        <option value="Todas">Todas las Categorías</option>
                        <option value="Frenos">Frenos</option>
                        <option value="Motor">Motor</option>
                        <option value="Servicios">Servicios</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                    </select>
                </div>

                <button className="btn-act-table link" style={{ padding: '6px 14px' }} onClick={() => alert("Filtros de reporte aplicados en la vista actual.")}>
                    🔍 Aplicar Filtros
                </button>
            </div>

            {/* PESTAÑAS HORIZONTALES PRINCIPALES */}
            <div className="reportes-tabs-nav">
                {["Ventas Generales", "Ventas por Ítems", "Operaciones"].map(tab => (
                    <button
                        key={tab}
                        className={`reportes-tab-btn ${submodulo === tab ? "active" : ""}`}
                        onClick={() => setSubmodulo(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* 1. VENTAS GENERALES */}
            {submodulo === "Ventas Generales" && (
                <div>
                    <div className="reportes-card-grid">
                        <div className="reporte-stat-box">
                            <span>Ingresos Totales Brutos</span>
                            <h3>S/ 82,360.00</h3>
                        </div>
                        <div className="reporte-stat-box">
                            <span>Costo de Ventas (COGS)</span>
                            <h3>S/ 48,160.00</h3>
                        </div>
                        <div className="reporte-stat-box">
                            <span>Margen Bruto Total</span>
                            <h3 style={{ color: '#16a34a' }}>S/ 34,200.00 (41.5%)</h3>
                        </div>
                        <div className="reporte-stat-box">
                            <span>Total ODS Facturadas</span>
                            <h3>142 ODS</h3>
                        </div>
                    </div>

                    <div className="reporte-chart-section">
                        <h3>📊 Resumen de Ventas Generales por Categoría de Ingreso</h3>
                        <div className="os-table-wrapper">
                            <table className="os-table">
                                <thead>
                                    <tr>
                                        <th>Categoría de Ingreso</th>
                                        <th>N° Operaciones</th>
                                        <th>Monto Bruto (S/)</th>
                                        <th>Costo Directo (S/)</th>
                                        <th>Utilidad Neta (S/)</th>
                                        <th>Margen %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Mano de Obra (Taller)</strong></td>
                                        <td>118</td>
                                        <td>S/ 38,500.00</td>
                                        <td>S/ 12,200.00</td>
                                        <td>S/ 26,300.00</td>
                                        <td><span className="proc-tag preventivo">68.3%</span></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Venta de Repuestos e Insumos</strong></td>
                                        <td>142</td>
                                        <td>S/ 32,860.00</td>
                                        <td>S/ 21,500.00</td>
                                        <td>S/ 11,360.00</td>
                                        <td><span className="proc-tag preventivo">34.5%</span></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Servicios Externos / Tercerizados</strong></td>
                                        <td>24</td>
                                        <td>S/ 11,000.00</td>
                                        <td>S/ 8,400.00</td>
                                        <td>S/ 2,600.00</td>
                                        <td><span className="proc-tag correctivo">23.6%</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. VENTAS POR ÍTEMS */}
            {submodulo === "Ventas por Ítems" && (
                <div>
                    <div className="reporte-chart-section">
                        <h3>📦 Desglose de Ventas por Ítems de Inventario / Servicios</h3>
                        <div className="os-table-wrapper">
                            <table className="os-table">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombre del Ítem</th>
                                        <th>Categoría</th>
                                        <th>Unidades Vendidas</th>
                                        <th>Costo Acumulado</th>
                                        <th>Venta Total</th>
                                        <th>Margen de Ganancia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ventasItemsData.map((item, i) => (
                                        <tr key={i}>
                                            <td><strong>{item.codigo}</strong></td>
                                            <td>{item.nombre}</td>
                                            <td>{item.categoria}</td>
                                            <td>{item.cantidad}</td>
                                            <td>S/ {item.costoTotal.toFixed(2)}</td>
                                            <td><strong>S/ {item.ventaTotal.toFixed(2)}</strong></td>
                                            <td><span className="proc-tag preventivo">{item.margen}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. OPERACIONES (SUBMENÚS: RENTABILIDAD & TÉCNICOS) */}
            {submodulo === "Operaciones" && (
                <div>
                    <div className="subtab-pill-container">
                        <button
                            className={`subtab-pill ${subOperaciones === "Rentabilidad" ? "active" : ""}`}
                            onClick={() => setSubOperaciones("Rentabilidad")}
                        >
                            💰 Rentabilidad por ODS
                        </button>
                        <button
                            className={`subtab-pill ${subOperaciones === "Técnicos" ? "active" : ""}`}
                            onClick={() => setSubOperaciones("Técnicos")}
                        >
                            👨‍🔧 Rendimiento por Técnico
                        </button>
                    </div>

                    {subOperaciones === "Rentabilidad" && (
                        <div className="reporte-chart-section">
                            <h3>💵 Análisis de Rentabilidad Detallada por Orden de Servicio</h3>
                            <div className="os-table-wrapper">
                                <table className="os-table">
                                    <thead>
                                        <tr>
                                            <th>ODS Ticket</th>
                                            <th>Cliente</th>
                                            <th>Técnico</th>
                                            <th>Mano Obra</th>
                                            <th>Repuestos</th>
                                            <th>Serv. Terceros</th>
                                            <th>Venta Total</th>
                                            <th>Utilidad Neta</th>
                                            <th>Margen %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rentabilidadODSData.map((row, i) => (
                                            <tr key={i}>
                                                <td><strong>{row.ods}</strong></td>
                                                <td>{row.cliente}</td>
                                                <td>{row.tecnico}</td>
                                                <td>S/ {row.manoObra.toFixed(2)}</td>
                                                <td>S/ {row.repuestos.toFixed(2)}</td>
                                                <td>S/ {row.terceros.toFixed(2)}</td>
                                                <td><strong>S/ {row.ventaTotal.toFixed(2)}</strong></td>
                                                <td><span style={{ color: '#16a34a', fontWeight: 'bold' }}>S/ {row.utilidad.toFixed(2)}</span></td>
                                                <td><span className="proc-tag preventivo">{row.margen}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {subOperaciones === "Técnicos" && (
                        <div className="reporte-chart-section">
                            <h3>⏱️ Rendimiento Operativo y Eficiencia de Técnicos Automotrices</h3>
                            <div className="os-table-wrapper">
                                <table className="os-table">
                                    <thead>
                                        <tr>
                                            <th>Técnico Automotriz</th>
                                            <th>Especialidad</th>
                                            <th>ODS Atendidas</th>
                                            <th>HH Estimadas</th>
                                            <th>HH Producidas (Vendidas)</th>
                                            <th>Eficiencia Operativa</th>
                                            <th>NPS / Satisfacción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tecnicosData.map((t, i) => (
                                            <tr key={i}>
                                                <td><strong>{t.nombre}</strong></td>
                                                <td>{t.especialidad}</td>
                                                <td>{t.odsAtendidas} ODS</td>
                                                <td>{t.hhEstimadas} hrs</td>
                                                <td><strong>{t.hhProducidas} hrs</strong></td>
                                                <td><span className="proc-tag preventivo">{t.eficiencia}</span></td>
                                                <td><strong>{t.satisfaccion}</strong> ⭐</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

export default Reportes;