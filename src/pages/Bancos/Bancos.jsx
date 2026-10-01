import { useState, useEffect } from "react";
import "./Bancos.css";
import { obtenerCuentasBancarias, obtenerMovimientosBancarios, registrarMovimiento } from "../../services/bancosService";
import { useRole } from "../../context/authContext";

const SUBMENUS_BANCOS = [
    "Cuentas Bancarias",
    "Movimientos / Transacciones"
];

function Bancos() {
    const { usuarioActual } = useRole();
    const [submodulo, setSubmodulo] = useState("Cuentas Bancarias");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [tipoFiltro, setTipoFiltro] = useState("Todos");
    const [cargando, setCargando] = useState(false);
    const [cuentaOrigen, setCuentaOrigen] = useState("");
    const [tipoMov, setTipoMov] = useState("Ingreso");
    const [categoriaMov, setCategoriaMov] = useState("");
    const [montoMov, setMontoMov] = useState("");
    const [referenciaMov, setReferenciaMov] = useState("");

    // Cuentas Bancarias
    const [cuentas, setCuentas] = useState([]);
    const [movimientos, setMovimientos] = useState([]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [cuentasData, movimientosData] = await Promise.all([
                obtenerCuentasBancarias(),
                obtenerMovimientosBancarios()
            ]);
            setCuentas(cuentasData);
            setCuentaOrigen((actual) => actual || String(cuentasData[0]?.cuenta_bancaria_id || ""));
            setMovimientos(movimientosData);
        } catch (error) {
            console.error("Error cargando datos bancarios:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        let activa = true;
        queueMicrotask(() => { if (activa) cargarDatos(); });
        return () => { activa = false; };
    }, []);

    const saldoTotal = cuentas.reduce((t, c) => t + parseFloat(c.saldo_actual || 0), 0);

    const registrarMovimientoFn = async (e) => {
        e.preventDefault();
        if (!montoMov || Number(montoMov) <= 0) {
            alert("Ingresa un monto válido.");
            return;
        }

        try {
            if (!usuarioActual?.user_id) throw new Error("Inicia sesión para registrar el movimiento.");
            const nuevoMovimiento = {
                cuenta_bancaria_id: parseInt(cuentaOrigen),
                usuario_id: usuarioActual.user_id,
                tipo_movimiento: tipoMov,
                concepto: categoriaMov,
                monto: parseFloat(montoMov),
                referencia: referenciaMov.trim() || null
            };

            await registrarMovimiento(nuevoMovimiento);
            setMostrarModal(false);
            setMontoMov("");
            setReferenciaMov("");
            cargarDatos();
            alert(`¡Movimiento bancario por S/ ${montoMov} registrado exitosamente!`);
        } catch (error) {
            console.error("Error registrando movimiento:", error);
            alert("Error al registrar el movimiento");
        }
    };

    const movFiltrados = movimientos.filter(m =>
        tipoFiltro === "Todos" || m.tipo_movimiento === tipoFiltro
    );

    return (
        <div className="bancos-page">

            {cargando && <p role="status">Consultando cuentas y movimientos…</p>}

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
                {cuentas.map((c) => (
                    <div key={c.cuenta_bancaria_id} className="banco-card">
                        <span>{c.banco}</span>
                        <h3>S/ {parseFloat(c.saldo_actual).toFixed(2)}</h3>
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
                                <th>Nombre Cuenta</th>
                                <th>Moneda</th>
                                <th>Saldo Disponible (S/)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cuentas.map((c) => (
                                <tr key={c.cuenta_bancaria_id}>
                                    <td><strong>🏦 {c.banco}</strong></td>
                                    <td>{c.tipo_cuenta}</td>
                                    <td>{c.numero_cuenta}</td>
                                    <td>{c.nombre_cuenta}</td>
                                    <td>{c.moneda}</td>
                                    <td><strong style={{ color: '#16a34a', fontSize: '1rem' }}>S/ {parseFloat(c.saldo_actual).toFixed(2)}</strong></td>
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
                                    <tr key={m.movimiento_bancario_id}>
                                        <td><strong>TRX-{m.movimiento_bancario_id}</strong></td>
                                        <td>{new Date(m.fecha).toLocaleDateString()}</td>
                                        <td>{m.cuenta?.banco || 'Cuenta'}</td>
                                        <td>
                                            <span className={`proc-tag ${m.tipo_movimiento === "Ingreso" ? "preventivo" : "correctivo"}`}>
                                                {m.tipo_movimiento === "Ingreso" ? "🟢 + Ingreso" : "🔴 - Egreso"}
                                            </span>
                                        </td>
                                        <td>{m.concepto}</td>
                                        <td>{m.referencia}</td>
                                        <td><strong style={{ color: m.tipo_movimiento === "Ingreso" ? '#16a34a' : '#dc2626' }}>S/ {parseFloat(m.monto).toFixed(2)}</strong></td>
                                        <td><span className="proc-tag link">Registrado</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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

                        <form onSubmit={registrarMovimientoFn}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Cuenta Bancaria *</label>
                                        <select value={cuentaOrigen} onChange={(e) => setCuentaOrigen(e.target.value)}>
                                            <option value="">Selecciona cuenta</option>
                                            {cuentas.map((c) => (
                                                <option key={c.cuenta_bancaria_id} value={c.cuenta_bancaria_id}>
                                                    {c.banco} ({c.numero_cuenta})
                                                </option>
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