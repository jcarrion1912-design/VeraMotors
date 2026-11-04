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

    const nombreCuenta = (cuentaId) =>
        cuentas.find((c) => Number(c.cuenta_bancaria_id) === Number(cuentaId))?.banco || "Cuenta no encontrada";

    // Estado de cuenta: del movimiento más reciente al más antiguo, partiendo del saldo actual.
    const [cuentaEstado, setCuentaEstado] = useState(null);

    const lineasEstadoCuenta = (() => {
        if (!cuentaEstado) return [];
        let saldo = parseFloat(cuentaEstado.saldo_actual) || 0;
        return movimientos
            .filter((m) => Number(m.cuenta_bancaria_id) === Number(cuentaEstado.cuenta_bancaria_id))
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha) || b.movimiento_bancario_id - a.movimiento_bancario_id)
            .map((m) => {
                const monto = parseFloat(m.monto) || 0;
                const linea = { ...m, monto, saldoTras: saldo };
                saldo += m.tipo_movimiento === "Ingreso" ? -monto : monto;
                return linea;
            });
    })();

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
                    Registrar Movimiento / Transferencia
                </button>
            </div>

            {/* TARJETAS KPI BANCOS */}
            <div className="bancos-kpi-grid">
                <div className="banco-card banco-card-total">
                    <span>Posición de Caja Total</span>
                    <h3>S/ {saldoTotal.toFixed(2)}</h3>
                </div>
                {cuentas.map((c) => (
                    <div key={c.cuenta_bancaria_id} className="banco-card">
                        <span>{c.banco}</span>
                        <h3>S/ {parseFloat(c.saldo_actual).toFixed(2)}</h3>
                    </div>
                ))}
            </div>

            {/* PESTAÑAS SUBMÓDULO */}
            <div className="reportes-tabs-nav">
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
                                <th className="vm-num">Saldo Disponible (S/)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cuentas.map((c) => (
                                <tr key={c.cuenta_bancaria_id}>
                                    <td>
                                        <strong className="bancos-entidad">
                                            <span className="material-symbols-outlined">account_balance</span>
                                            {c.banco}
                                        </strong>
                                    </td>
                                    <td>{c.tipo_cuenta}</td>
                                    <td><span className="vm-code">{c.numero_cuenta}</span></td>
                                    <td>{c.nombre_cuenta}</td>
                                    <td>{c.moneda}</td>
                                    <td className="vm-num"><span className="bancos-monto bancos-monto-ingreso">S/ {parseFloat(c.saldo_actual).toFixed(2)}</span></td>
                                    <td>
                                        <button className="btn-act-table link" onClick={() => setCuentaEstado(c)}>
                                            <span className="material-symbols-outlined">receipt_long</span>
                                            Estado de Cuenta
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="vm-empty bancos-tabla-vacia">
                        <span className="material-symbols-outlined">account_balance</span>
                        <strong>Sin cuentas bancarias</strong>
                        <span>Todavía no hay cuentas registradas para mostrar.</span>
                    </div>
                </div>
            )}

            {/* SUBMÓDULO 2: MOVIMIENTOS / TRANSACCIONES */}
            {submodulo === "Movimientos / Transacciones" && (
                <div>
                    <div className="os-filter-bar">
                        <div className="reportes-filter-item">
                            <label>Filtrar Movimiento:</label>
                            <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
                                <option value="Todos">Todos (Ingresos & Egresos)</option>
                                <option value="Ingreso">Solo Ingresos (+)</option>
                                <option value="Egreso">Solo Egresos (-)</option>
                            </select>
                        </div>
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
                                    <th className="vm-num">Monto (S/)</th>
                                    <th>Estado Conciliación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movFiltrados.map(m => (
                                    <tr key={m.movimiento_bancario_id}>
                                        <td><span className="vm-code">TRX-{m.movimiento_bancario_id}</span></td>
                                        <td>{new Date(m.fecha).toLocaleDateString()}</td>
                                        <td>{nombreCuenta(m.cuenta_bancaria_id)}</td>
                                        <td>
                                            <span className={`vm-badge ${m.tipo_movimiento === "Ingreso" ? "vm-badge-success" : "vm-badge-danger"}`}>
                                                {m.tipo_movimiento === "Ingreso" ? "+ Ingreso" : "- Egreso"}
                                            </span>
                                        </td>
                                        <td>{m.concepto}</td>
                                        <td className="bancos-referencia">{m.referencia}</td>
                                        <td className="vm-num"><span className={`bancos-monto ${m.tipo_movimiento === "Ingreso" ? "bancos-monto-ingreso" : "bancos-monto-egreso"}`}>S/ {parseFloat(m.monto).toFixed(2)}</span></td>
                                        <td><span className="vm-badge vm-badge-info">Registrado</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="vm-empty bancos-tabla-vacia">
                            <span className="material-symbols-outlined">swap_vert</span>
                            <strong>Sin movimientos</strong>
                            <span>No hay transacciones para el filtro seleccionado.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ESTADO DE CUENTA */}
            {cuentaEstado && (
                <div className="modal-overlay">
                    <div className="modal-content bancos-estado-modal">
                        <div className="modal-header">
                            <div>
                                <h2>Estado de Cuenta · {cuentaEstado.banco}</h2>
                                <p>{cuentaEstado.nombre_cuenta} · {cuentaEstado.numero_cuenta} · Saldo actual S/ {parseFloat(cuentaEstado.saldo_actual).toFixed(2)}</p>
                            </div>
                            <button className="btn-close" aria-label="Cerrar" onClick={() => setCuentaEstado(null)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            {lineasEstadoCuenta.length > 0 ? (
                                <div className="vm-table-wrap">
                                    <table className="vm-table">
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Concepto</th>
                                                <th>Referencia</th>
                                                <th className="vm-num">Ingreso</th>
                                                <th className="vm-num">Egreso</th>
                                                <th className="vm-num">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lineasEstadoCuenta.map((m) => (
                                                <tr key={m.movimiento_bancario_id}>
                                                    <td>{new Date(m.fecha).toLocaleDateString()}</td>
                                                    <td>{m.concepto}</td>
                                                    <td className="bancos-referencia">{m.referencia}</td>
                                                    <td className="vm-num">{m.tipo_movimiento === "Ingreso" ? `S/ ${m.monto.toFixed(2)}` : "—"}</td>
                                                    <td className="vm-num">{m.tipo_movimiento === "Ingreso" ? "—" : `S/ ${m.monto.toFixed(2)}`}</td>
                                                    <td className="vm-num"><strong>S/ {m.saldoTras.toFixed(2)}</strong></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="vm-empty">
                                    <span className="material-symbols-outlined">receipt_long</span>
                                    <strong>Sin movimientos</strong>
                                    <span>Esta cuenta todavía no tiene transacciones registradas.</span>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-cancelar" onClick={() => setCuentaEstado(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL REGISTRAR MOVIMIENTO */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content bancos-modal">
                        <div className="modal-header">
                            <div>
                                <h2>Registrar Movimiento Bancario / Caja</h2>
                                <p>Ingresa los detalles del flujo de dinero en tesorería.</p>
                            </div>
                            <button className="btn-close" aria-label="Cerrar" onClick={() => setMostrarModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={registrarMovimientoFn}>
                            <div className="modal-body">
                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">account_balance</span>
                                    Cuenta y tipo
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Cuenta Bancaria *</label>
                                        <select value={cuentaOrigen} onChange={(e) => setCuentaOrigen(e.target.value)}>
                                            <option value="">Selecciona cuenta</option>
                                            {cuentas.map((c) => (
                                                <option key={c.cuenta_bancaria_id} value={c.cuenta_bancaria_id}>
                                                    {c.banco} ({c.numero_cuenta})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Tipo Movimiento *</label>
                                        <select value={tipoMov} onChange={(e) => setTipoMov(e.target.value)}>
                                            <option value="Ingreso">Ingreso (+)</option>
                                            <option value="Egreso">Egreso (-)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">edit_note</span>
                                    Detalle del movimiento
                                </div>
                                <div className="form-grid">
                                    <div className="form-group form-group-full">
                                        <label>Categoría / Concepto *</label>
                                        <input type="text" value={categoriaMov} onChange={(e) => setCategoriaMov(e.target.value)} placeholder="Ej: Cobro ODS-1004, Pago Proveedor, Servicios..." required />
                                    </div>
                                    <div className="form-group">
                                        <label>Monto S/ *</label>
                                        <input type="number" value={montoMov} onChange={(e) => setMontoMov(e.target.value)} placeholder="0.00" step="0.01" required />
                                    </div>
                                    <div className="form-group">
                                        <label>N° Referencia / Factura</label>
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