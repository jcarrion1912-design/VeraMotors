import { useState } from "react";
import "./Metricas.css";

const SUBMENUS_METRICAS = [
    "Principal",
    "General",
    "Ventas",
    "Satisfacción del Cliente (NPS)"
];

function Metricas() {
    const [subtab, setSubtab] = useState("Principal");

    return (
        <div className="metricas-page">

            {/* CABECERA DE MÉTRICAS */}
            <div className="metricas-header">
                <div>
                    <h2>Métricas y Analítica de Rendimiento</h2>
                    <p>Indicadores clave de desempeño (KPIs), horas hombre, rentabilidad y NPS de VeraMotors.</p>
                </div>

                <div className="metricas-date-filter">
                    <label>Periodo:</label>
                    <select style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '6px 12px' }}>
                        <option>Este Mes (Agosto 2026)</option>
                        <option>Trimestre Actual (Q3)</option>
                        <option>Año 2026</option>
                    </select>
                </div>
            </div>

            {/* SUBMENÚ HORIZONTAL SUPERIOR */}
            <div className="metricas-subnav">
                {SUBMENUS_METRICAS.map(tab => (
                    <button
                        key={tab}
                        className={`metricas-tab-btn ${subtab === tab ? "active" : ""}`}
                        onClick={() => setSubtab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* 1. SUBPESTAÑA: PRINCIPAL */}
            {subtab === "Principal" && (
                <div className="metricas-content-grid">
                    
                    {/* TARJETAS DE INDICADORES CLAVE */}
                    <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div className="kpi-box">
                            <span>Horas Hombre Vendidas</span>
                            <h3>284.5 HH</h3>
                            <small className="positive">↑ +14% vs mes anterior</small>
                        </div>
                        <div className="kpi-box">
                            <span>Vehículos Atendidos</span>
                            <h3>142 Vehículos</h3>
                            <small className="positive">↑ +8% vs mes anterior</small>
                        </div>
                        <div className="kpi-box">
                            <span>Ticket Promedio</span>
                            <h3>S/ 580.00</h3>
                            <small className="positive">↑ +5% vs mes anterior</small>
                        </div>
                        <div className="kpi-box">
                            <span>Tiempo Medio Permanencia</span>
                            <h3>4.2 Horas</h3>
                            <small className="positive">↓ -12% optimizado</small>
                        </div>
                    </div>

                    {/* GRÁFICOS VISUALES */}
                    <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="chart-card">
                            <h3>📊 Horas Hombre Vendidas por Semana</h3>
                            <div className="bar-chart-mock">
                                <div className="bar-group">
                                    <div className="bar" style={{ height: '65%' }}><span>65h</span></div>
                                    <label>Sem 1</label>
                                </div>
                                <div className="bar-group">
                                    <div className="bar" style={{ height: '80%' }}><span>80h</span></div>
                                    <label>Sem 2</label>
                                </div>
                                <div className="bar-group">
                                    <div className="bar" style={{ height: '70%' }}><span>70h</span></div>
                                    <label>Sem 3</label>
                                </div>
                                <div className="bar-group">
                                    <div className="bar" style={{ height: '90%' }}><span>90h</span></div>
                                    <label>Sem 4</label>
                                </div>
                            </div>
                        </div>

                        <div className="chart-card">
                            <h3>🚗 Vehículos Atendidos por Categoría</h3>
                            <div className="bar-chart-mock">
                                <div className="bar-group">
                                    <div className="bar green" style={{ height: '75%' }}><span>55 Auto</span></div>
                                    <label>Automóvil</label>
                                </div>
                                <div className="bar-group">
                                    <div className="bar green" style={{ height: '60%' }}><span>42 SUV</span></div>
                                    <label>SUV</label>
                                </div>
                                <div className="bar-group">
                                    <div className="bar green" style={{ height: '45%' }}><span>28 Pick-up</span></div>
                                    <label>Pick-up</label>
                                </div>
                                <div className="bar-group">
                                    <div className="bar green" style={{ height: '30%' }}><span>17 Van</span></div>
                                    <label>Van</label>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* 2. SUBPESTAÑA: GENERAL */}
            {subtab === "General" && (
                <div className="metricas-content-grid">
                    <div className="chart-card" style={{ marginBottom: '20px' }}>
                        <h3>📈 Acumulado Mensual de ODS y Nuevos Clientes</h3>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Tendencia de crecimiento acumulado año 2026.</p>
                        
                        <div className="line-chart-mock" style={{ height: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 0', borderBottom: '2px solid #334155' }}>
                            {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"].map((m, i) => (
                                <div key={m} style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ background: '#38bdf8', height: `${(i + 3) * 22}px`, width: '12px', margin: '0 auto', borderRadius: '4px' }}></div>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', display: 'block' }}>{m}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. SUBPESTAÑA: VENTAS */}
            {subtab === "Ventas" && (
                <div className="metricas-content-grid">
                    <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                        <div className="kpi-box"><span>Ventas Totales</span><h3>S/ 82,360</h3></div>
                        <div className="kpi-box"><span>Mano de Obra</span><h3>S/ 38,500</h3></div>
                        <div className="kpi-box"><span>Repuestos</span><h3>S/ 32,860</h3></div>
                        <div className="kpi-box"><span>Servicios Externos</span><h3>S/ 11,000</h3></div>
                        <div className="kpi-box" style={{ background: '#14532d' }}><span>Utilidad / Rentabilidad</span><h3 style={{ color: '#4ade80' }}>S/ 34,200 (41.5%)</h3></div>
                    </div>

                    <div className="chart-card">
                        <h3>📊 Desglose de Ventas por Tipo de Servicio</h3>
                        <div className="bar-chart-mock">
                            <div className="bar-group"><div className="bar purple" style={{ height: '85%' }}><span>Mano Obra</span></div><label>Mano de Obra</label></div>
                            <div className="bar-group"><div className="bar purple" style={{ height: '70%' }}><span>Repuestos</span></div><label>Repuestos</label></div>
                            <div className="bar-group"><div className="bar purple" style={{ height: '35%' }}><span>Terceros</span></div><label>Serv. Externos</label></div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. SUBPESTAÑA: SATISFACCIÓN DEL CLIENTE (NPS) */}
            {subtab === "Satisfacción del Cliente (NPS)" && (
                <div className="metricas-content-grid">
                    <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div className="kpi-box" style={{ background: '#1e3a8a' }}>
                            <span>NPS Mensual (Agosto)</span>
                            <h3 style={{ color: '#60a5fa' }}>92% Promotores</h3>
                        </div>
                        <div className="kpi-box">
                            <span>NPS Trimestral (Q3)</span>
                            <h3>89% Promotores</h3>
                        </div>
                        <div className="kpi-box">
                            <span>NPS Anual 2026</span>
                            <h3>90.5% Promotores</h3>
                        </div>
                    </div>

                    <div className="chart-card">
                        <h3>⭐ Índice de Satisfacción NPS por Periodo</h3>
                        <div className="bar-chart-mock">
                            <div className="bar-group"><div className="bar yellow" style={{ height: '92%' }}><span>92%</span></div><label>Mensual</label></div>
                            <div className="bar-group"><div className="bar yellow" style={{ height: '89%' }}><span>89%</span></div><label>Trimestral</label></div>
                            <div className="bar-group"><div className="bar yellow" style={{ height: '91%' }}><span>91%</span></div><label>Anual</label></div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Metricas;