import { useEffect, useState } from "react";
import { obtenerUsuarios } from "../../services/usuariosService";
import { abrirCaja, cerrarCaja, obtenerCajaActual, obtenerCierresCaja } from "../../services/cobrosService";
import "./Caja.css";

const moneda = (valor) => Number(valor || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" });
const fechaHora = (valor) => valor ? new Date(valor).toLocaleString("es-PE") : "-";

function Caja({ refreshKey = 0 }) {
    const [caja, setCaja] = useState(null);
    const [cierres, setCierres] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioApertura, setUsuarioApertura] = useState("");
    const [usuarioCierre, setUsuarioCierre] = useState("");
    const [montoInicial, setMontoInicial] = useState("");
    const [montoReal, setMontoReal] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const refrescar = async () => {
        const [actual, historial, listaUsuarios] = await Promise.all([
            obtenerCajaActual(), obtenerCierresCaja(), obtenerUsuarios(),
        ]);
        const activos = listaUsuarios.filter((usuario) => usuario.activo);
        setCaja(actual);
        setCierres(historial);
        setUsuarios(activos);
        if (actual?.estado === "Abierta") setUsuarioCierre(String(actual.usuario_id));
    };

    useEffect(() => {
        let activa = true;
        Promise.all([obtenerCajaActual(), obtenerCierresCaja(), obtenerUsuarios()])
            .then(([actual, historial, listaUsuarios]) => {
                if (!activa) return;
                setCaja(actual);
                setCierres(historial);
                setUsuarios(listaUsuarios.filter((usuario) => usuario.activo));
                if (actual?.estado === "Abierta") setUsuarioCierre(String(actual.usuario_id));
            })
            .catch((loadError) => {
                if (activa) setError(loadError.message || "No se pudo cargar la caja.");
            })
            .finally(() => {
                if (activa) setCargando(false);
            });
        return () => { activa = false; };
    }, [refreshKey]);

    const ejecutarApertura = async (event) => {
        event.preventDefault();
        setGuardando(true);
        setError("");
        setMensaje("");
        try {
            await abrirCaja({
                usuario_id: Number(usuarioApertura),
                monto_inicial: Number(montoInicial),
                observaciones: observaciones || null,
            });
            setMensaje("Caja abierta y registrada en PostgreSQL.");
            setObservaciones("");
            setMontoInicial("");
            await refrescar();
        } catch (saveError) {
            setError(saveError.message || "No se pudo abrir la caja.");
        } finally {
            setGuardando(false);
        }
    };

    const ejecutarCierre = async (event) => {
        event.preventDefault();
        setGuardando(true);
        setError("");
        setMensaje("");
        try {
            await cerrarCaja({
                usuario_id: Number(usuarioCierre),
                monto_real: Number(montoReal),
                observaciones: observaciones || null,
            });
            setMensaje("Caja cerrada con totales calculados desde los pagos registrados.");
            setMontoReal("");
            setObservaciones("");
            await refrescar();
        } catch (saveError) {
            setError(saveError.message || "No se pudo cerrar la caja.");
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) return <section className="caja-page"><p className="vm-loading">Consultando caja y movimientos…</p></section>;

    return (
        <section className="caja-page">
            <header className="vm-page-head">
                <div>
                    <h2>Caja</h2>
                    <p>Apertura, cobros y cierre registrados en PostgreSQL.</p>
                </div>
            </header>

            {error && <div className="vm-alert" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span>{error}</div>}
            {mensaje && <div className="vm-alert vm-alert-success" role="status"><span className="material-symbols-outlined" aria-hidden="true">check_circle</span>{mensaje}</div>}

            {caja?.estado === "Abierta" ? (
                <div className="vm-card">
                    <div className="vm-card-head caja-session-head">
                        <div className="caja-session-title">
                            <span className="vm-badge vm-badge-success">Abierta</span>
                            <h3>Caja #{caja.cierre_caja_id}</h3>
                        </div>
                        <div className="caja-session-user">
                            <small>Usuario de apertura</small>
                            <strong>{caja.usuario_nombre || caja.usuario_id}</strong>
                        </div>
                    </div>
                    <div className="vm-card-body caja-session-body">
                        <div className="caja-session-meta">
                            <span>Apertura: {fechaHora(caja.fecha_apertura)}</span>
                            <span>Monto inicial: {moneda(caja.monto_inicial)}</span>
                        </div>
                        <div className="caja-totals">
                            <div className="vm-kpi"><span className="vm-kpi-label">Efectivo</span><strong className="vm-kpi-value">{moneda(caja.total_efectivo)}</strong></div>
                            <div className="vm-kpi"><span className="vm-kpi-label">Tarjeta</span><strong className="vm-kpi-value">{moneda(caja.total_tarjeta)}</strong></div>
                            <div className="vm-kpi"><span className="vm-kpi-label">Transferencia</span><strong className="vm-kpi-value">{moneda(caja.total_transferencia)}</strong></div>
                            <div className="vm-kpi"><span className="vm-kpi-label">Yape</span><strong className="vm-kpi-value">{moneda(caja.total_yape)}</strong></div>
                            <div className="vm-kpi"><span className="vm-kpi-label">Plin</span><strong className="vm-kpi-value">{moneda(caja.total_plin)}</strong></div>
                            <div className="vm-kpi"><span className="vm-kpi-label">Otros</span><strong className="vm-kpi-value">{moneda(caja.total_otros)}</strong></div>
                            <div className="vm-kpi caja-kpi-total"><span className="vm-kpi-label">Total cobrado</span><strong className="vm-kpi-value">{moneda(caja.total_ventas)}</strong></div>
                            <div className="vm-kpi caja-kpi-total"><span className="vm-kpi-label">Operaciones</span><strong className="vm-kpi-value">{caja.cantidad_operaciones}</strong></div>
                            <div className="vm-kpi caja-kpi-total"><span className="vm-kpi-label">Efectivo esperado</span><strong className="vm-kpi-value">{moneda(caja.total_esperado)}</strong></div>
                        </div>
                        <form className="caja-form" onSubmit={ejecutarCierre}>
                            <h3 className="vm-form-section-title"><span className="material-symbols-outlined" aria-hidden="true">lock</span>Cerrar caja</h3>
                            <div className="form-grid caja-fields">
                                <label className="form-group">Usuario de cierre<select value={usuarioCierre} onChange={(event) => setUsuarioCierre(event.target.value)} required><option value="">Selecciona usuario</option>{usuarios.map((usuario) => <option key={usuario.user_id} value={usuario.user_id}>{usuario.nombre}</option>)}</select></label>
                                <label className="form-group">Efectivo contado<input type="number" min="0" step="0.01" value={montoReal} onChange={(event) => setMontoReal(event.target.value)} required /></label>
                                <label className="form-group">Observaciones<input value={observaciones} onChange={(event) => setObservaciones(event.target.value)} /></label>
                            </div>
                            <button className="vm-btn vm-btn-primary caja-submit" type="submit" disabled={guardando || !usuarioCierre}>{guardando ? "Cerrando…" : "Confirmar cierre"}</button>
                        </form>
                    </div>
                </div>
            ) : (
                <form className="vm-card vm-card-body caja-form" onSubmit={ejecutarApertura}>
                    <div>
                        <h3 className="vm-form-section-title"><span className="material-symbols-outlined" aria-hidden="true">lock_open</span>Apertura de caja</h3>
                        <p className="caja-form-note">{caja?.estado === "Cerrada" ? `Último cierre: ${fechaHora(caja.fecha_cierre)} · ${moneda(caja.total_ventas)} cobrados.` : "No hay una caja abierta."}</p>
                    </div>
                    <div className="form-grid caja-fields">
                        <label className="form-group">Usuario responsable<select value={usuarioApertura} onChange={(event) => setUsuarioApertura(event.target.value)} required><option value="">Selecciona usuario</option>{usuarios.map((usuario) => <option key={usuario.user_id} value={usuario.user_id}>{usuario.nombre}</option>)}</select></label>
                        <label className="form-group">Monto inicial<input type="number" min="0" step="0.01" value={montoInicial} onChange={(event) => setMontoInicial(event.target.value)} required /></label>
                        <label className="form-group">Observaciones<input value={observaciones} onChange={(event) => setObservaciones(event.target.value)} /></label>
                    </div>
                    <button className="vm-btn vm-btn-primary caja-submit" type="submit" disabled={guardando || !usuarioApertura}>{guardando ? "Abriendo…" : "Abrir caja"}</button>
                </form>
            )}

            <div className="vm-card caja-history">
                <div className="vm-card-head">
                    <h3><span className="material-symbols-outlined" aria-hidden="true">history</span>Historial de cierres</h3>
                </div>
                <div className="vm-table-wrap">
                    <table className="vm-table caja-table">
                        <thead>
                            <tr>
                                <th>Caja</th>
                                <th>Usuario</th>
                                <th>Apertura</th>
                                <th>Cierre</th>
                                <th className="vm-num">Efectivo</th>
                                <th className="vm-num">Tarjeta</th>
                                <th className="vm-num">Transferencia</th>
                                <th className="vm-num">Otros</th>
                                <th className="vm-num">Total</th>
                                <th className="vm-num">Operaciones</th>
                                <th className="vm-num">Diferencia</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>{cierres.length ? cierres.map((cierre) => (
                            <tr key={cierre.cierre_caja_id}>
                                <td><span className="vm-code">#{cierre.cierre_caja_id}</span></td>
                                <td>{cierre.usuario_nombre || cierre.usuario_id}</td>
                                <td>{fechaHora(cierre.fecha_apertura)}</td>
                                <td>{fechaHora(cierre.fecha_cierre)}</td>
                                <td className="vm-num">{moneda(cierre.total_efectivo)}</td>
                                <td className="vm-num">{moneda(cierre.total_tarjeta)}</td>
                                <td className="vm-num">{moneda(cierre.total_transferencia)}</td>
                                <td className="vm-num">{moneda(cierre.total_otros)}</td>
                                <td className="vm-num"><strong>{moneda(cierre.total_ventas)}</strong></td>
                                <td className="vm-num">{cierre.cantidad_operaciones}</td>
                                <td className={`vm-num ${Number(cierre.diferencia) < 0 ? "caja-diferencia-negativa" : ""}`}>{moneda(cierre.diferencia)}</td>
                                <td><span className={`vm-badge ${cierre.estado === "Abierta" ? "vm-badge-success" : "is-plain"}`}>{cierre.estado}</span></td>
                            </tr>
                        )) : <tr><td colSpan="12"><div className="vm-empty"><span className="material-symbols-outlined" aria-hidden="true">point_of_sale</span><strong>Sin cierres registrados.</strong></div></td></tr>}</tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

export default Caja;
