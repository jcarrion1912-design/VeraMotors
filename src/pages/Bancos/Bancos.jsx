import { useState } from "react";
import "./Bancos.css";

const SUBMENUS_BANCOS = [
    "Cuentas Bancarias",
    "Movimientos / Transacciones",
    "Conciliación Bancaria"
];

function Bancos() {
    const [submodulo, setSubmodulo] = useState("Cuentas Bancarias");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [tipoFiltro, setTipoFiltro] = useState("Todos");

    // Cuentas Bancarias Simuladas
    const cuentas = [
        { banco: "BCP Soles", tipo: "Cuenta Corriente", numero: "191-84930281-0-12", cci: "002-191-0084930281012-54", titular: "VERAMOTORS S.A.C.", saldo: 42850.00 },
        { banco: "BBVA Soles", tipo: "Cuenta Corriente", numero: "0011-0382-0100039281", cci: "011-382-000100039281-88", titular: "VERAMOTORS S.A.C.", saldo: 28400.00 },
        { banco: "Interbank Soles", tipo: "Cuenta de Ahorros Empresa", numero: "200-3001827364", cci: "003-200-003001827364-19", titular: "VERAMOTORS S.A.C.", saldo: 15200.00 },
        { banco: "Caja Chica Taller", tipo: "Efectivo en Caja", numero: "CAJA-001", cci: "N/A", titular: "Caja Chica Taller VeraMotors", saldo: 2500.00 },
    ];

    const saldoTotal = cuentas.reduce((t, c) => t + c.saldo, 0);

    // Movimientos Simulado
    const [movimientos, setMovimientos] = useState([
        { id: "TRX-8801", fecha: "2026-08-23", cuenta: "BCP Soles", tipo: "Ingreso", categoria: "Cobro Factura ODS-1001", referencia: "FAC-001-0892", monto: 510.00, estado: "Conciliado" },
        { id: "TRX-8802", fecha: "2026-08-22", cuenta: "BCP Soles", tipo: "Ingreso", categoria: "Cobro Factura ODS-1003", referencia: "FAC-001-0893", monto: 1000.00, estado: "Conciliado" },
        { id: "TRX-8803", fecha: "2026-08-21", cuenta: "BBVA Soles", tipo: "Egreso", categoria: "Pago Proveedor Brembo Perú", referencia: "ODC-2026-081", monto: 3115.20, estado: "Conciliado" },
        { id: "TRX-8804", fecha: "2026-08-20", cuenta: "Caja Chica Taller", tipo: "Egreso", categoria: "Compra de Insumos Menores Limpieza", referencia: "BOLETA-3391", monto: 145.00, estado: "Pendiente" },
    ]);

    // Modal Form State
    const [cuentaOrigen, setCuentaOrigen] = useState("BCP Soles");
    const [tipoMov, setTipoMov] = useState("Ingreso");
    const [categoriaMov, setCategoriaMov] = useState("Cobro ODS / Venta");
    const [montoMov, setMontoMov] = useState("");
    const [referenciaMov, setReferenciaMov] = useState("");

    const registrarMovimiento = (e) => {
        e.preventDefault();
        if (!montoMov || Number(montoMov) <= 0) {
            alert("Ingresa un monto válido.");
            return;
        }

        const nuevo = {
            id: `TRX-880${movimientos.length + 1}`,
            fecha: new Date().toISOString().substring(0, 10),
            cuenta: cuentaOrigen,
            tipo: tipoMov,
            categoria: categoriaMov,
            referencia: referenciaMov || "N/A",
            monto: Number(montoMov),
            estado: "Conciliado"
        };

        setMovimientos([nuevo, ...movimientos]);
        setMostrarModal(false);
        setMontoMov("");
        setReferenciaMov("");
        alert(`¡Movimiento bancario ${nuevo.id} por S/ ${nuevo.monto.toFixed(2)} registrado exitosamente!`);
    };

    const movFiltrados = movimientos.filter(m => 
        tipoFiltro === "Todos" || m.tipo === tipoFiltro
    );

    return (
        <div className="bancos-page">

            {/* CABECERA */}
            <div className="bancos-header">
                <div>
                    <h2>Bancos y Tesorería</h2>
                    <p>Cuentas bancarias, saldos en tiempo real, conciliación y flujo de caja de VeraMotors SAC.</p>
                </div>

                <button className="btn-nuevo-movimiento" onClick={() => setMostrarModal(true)}>
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                    + Registrar Movimiento / Transferencia
                </button>
            </div>

            {/* TARJETAS KPI BANCOS */}
            <div className="bancos-kpi-grid">
                <div className="banco-card" style={{ borderLeft: '4px solid #16a34a' }}>
                    <span>Posición de Caja Total</span>
                    <h3 style={{ color: '#16a34a' }}>S/ {saldoTotal.toFixed(2)}</h3>
                </div>
                {cuentas.map((c, i) => (
                    <div key={i} className="banco-card">
                        <span>{c.banco}</span>
                        <h3>S/ {c.saldo.toFixed(2)}</h3>
                    </div>
                ))}
            </div>

            {/* PESTAÑAS SUBMÓDULO */}
            <div className="reportes-tabs-nav" style={{ marginBottom: '16px' }}>
                {SUBMENUS_BANCOS.map(tab => (
                    <button
                        key={tab}
                        className={`reportes-tab-btn ${submodulo === tab ? "active" : ""}`}
                        onClick={() => setSubmodulo(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* SUBMÓDULO 1: CUENTAS BANCARIAS */}
            {submodulo === "Cuentas Bancarias" && (
                <div className="os-table-wrapper">
                    <table className="os-table">
                        <thead>
                            <tr>
                                <th>Entidad Financiera</th>
                                <th>Tipo de Cuenta</th>
                                <th>Número de Cuenta</th>
                                <th>CCI (Interbancario)</th>
                                <th>Titular Registrado</th>
                                <th>Saldo Disponible (S/)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cuentas.map((c, idx) => (
                                <tr key={idx}>
                                    <td><strong>🏦 {c.banco}</strong></td>
                                    <td>{c.tipo}</td>
                                    <td>{c.numero}</td>
                                    <td>{c.cci}</td>
                                    <td>{c.titular}</td>
                                    <td><strong style={{ color: '#16a34a', fontSize: '1rem' }}>S/ {c.saldo.toFixed(2)}</strong></td>
                                    <td>
                                        <button className="btn-act-table link">📊 Estado de Cuenta</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* SUBMÓDULO 2: MOVIMIENTOS / TRANSACCIONES */}
            {submodulo === "Movimientos / Transacciones" && (
                <div>
                    <div className="os-filter-bar" style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Filtrar Movimiento:</label>
                        <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            <option value="Todos">Todos (Ingresos & Egresos)</option>
                            <option value="Ingreso">Solo Ingresos (+)</option>
                            <option value="Egreso">Solo Egresos (-)</option>
                        </select>
                    </div>

                    <div className="os-table-wrapper">
                        <table className="os-table">
                            <thead>
                                <tr>
                                    <th>ID Trx</th>
                                    <th>Fecha</th>
                                    <th>Cuenta Bancaria</th>
                                    <th>Tipo</th>
                                    <th>Categoría / Concepto</th>
                                    <th>Referencia / Comprobante</th>
                                    <th>Monto (S/)</th>
                                    <th>Estado Conciliación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movFiltrados.map(m => (
                                    <tr key={m.id}>
                                        <td><strong>{m.id}</strong></td>
                                        <td>{m.fecha}</td>
                                        <td>{m.cuenta}</td>
                                        <td>
                                            <span className={`proc-tag ${m.tipo === "Ingreso" ? "preventivo" : "correctivo"}`}>
                                                {m.tipo === "Ingreso" ? "🟢 + Ingreso" : "🔴 - Egreso"}
                                            </span>
                                        </td>
                                        <td>{m.categoria}</td>
                                        <td>{m.referencia}</td>
                                        <td><strong style={{ color: m.tipo === "Ingreso" ? '#16a34a' : '#dc2626' }}>S/ {m.monto.toFixed(2)}</strong></td>
                                        <td><span className="proc-tag link">{m.estado}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SUBMÓDULO 3: CONCILIACIÓN BANCARIA */}
            {submodulo === "Conciliación Bancaria" && (
                <div style={{ background: '#ffffff', padding: '40px', textAlign: 'center', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                    <h3>Módulo de Conciliación Bancaria Automática</h3>
                    <p>Carga extractos bancarios en formato CSV/Excel de BCP, BBVA o Interbank para cruce automático con facturas y ODS.</p>
                    <button className="btn-act-table link" style={{ marginTop: '14px', padding: '10px 20px', fontSize: '0.9rem' }} onClick={() => alert("Simulando carga de extracto bancario CSV... 100% registros conciliados.")}>
                        📂 Cargar Extracto Bancario CSV
                    </button>
                </div>
            )}

            {/* MODAL REGISTRAR MOVIMIENTO */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content bancos-modal" style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <div>
                                <h2>Registrar Movimiento Bancario / Caja</h2>
                                <p>Ingresa los detalles del flujo de dinero en tesorería.</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModal(false)}>✕</button>
                        </div>

                        <form onSubmit={registrarMovimiento}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Cuenta Bancaria *</label>
                                        <select value={cuentaOrigen} onChange={(e) => setCuentaOrigen(e.target.value)}>
                                            {cuentas.map((c, i) => (
                                                <option key={i} value={c.banco}>{c.banco}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Tipo Movimiento *</label>
                                        <select value={tipoMov} onChange={(e) => setTipoMov(e.target.value)}>
                                            <option value="Ingreso">🟢 Ingreso (+)</option>
                                            <option value="Egreso">🔴 Egreso (-)</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Categoría / Concepto *</label>
                                    <input type="text" value={categoriaMov} onChange={(e) => setCategoriaMov(e.target.value)} placeholder="Ej: Cobro ODS-1004, Pago Proveedor, Servicios..." required />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Monto S/ *</label>
                                        <input type="number" value={montoMov} onChange={(e) => setMontoMov(e.target.value)} placeholder="0.00" step="0.01" required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>N° Referencia / Factura</label>
                                        <input type="text" value={referenciaMov} onChange={(e) => setReferenciaMov(e.target.value)} placeholder="FAC-001-XXXX" />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setMostrarModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-guardar">Registrar Movimiento</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Bancos;