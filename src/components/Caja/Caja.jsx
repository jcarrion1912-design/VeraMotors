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

    if (cargando) return <section className="caja-page"><p>Consultando caja y movimientos…</p></section>;

    return (
        <section className="caja-page">
            <header className="caja-header"><div><h2>Caja</h2><p>Apertura, cobros y cierre registrados en PostgreSQL.</p></div></header>
            {error && <div className="caja-alert caja-alert-error" role="alert">{error}</div>}
            {mensaje && <div className="caja-alert caja-alert-success" role="status">{mensaje}</div>}

            {caja?.estado === "Abierta" ? (
                <div className="caja-session">
                    <div className="caja-session-heading"><div><span className="caja-state">Abierta</span><h3>Caja #{caja.cierre_caja_id}</h3></div><div><small>Usuario de apertura</small><strong>{caja.usuario_nombre || caja.usuario_id}</strong></div></div>
                    <div className="caja-session-meta"><span>Apertura: {fechaHora(caja.fecha_apertura)}</span><span>Monto inicial: {moneda(caja.monto_inicial)}</span></div>
                    <div className="caja-totals">
                        <div><span>Efectivo</span><strong>{moneda(caja.total_efectivo)}</strong></div>
                        <div><span>Tarjeta</span><strong>{moneda(caja.total_tarjeta)}</strong></div>
                        <div><span>Transferencia</span><strong>{moneda(caja.total_transferencia)}</strong></div>
                        <div><span>Yape</span><strong>{moneda(caja.total_yape)}</strong></div>
                        <div><span>Plin</span><strong>{moneda(caja.total_plin)}</strong></div>
                        <div><span>Otros</span><strong>{moneda(caja.total_otros)}</strong></div>
                        <div><span>Total cobrado</span><strong>{moneda(caja.total_ventas)}</strong></div>
                        <div><span>Operaciones</span><strong>{caja.cantidad_operaciones}</strong></div>
                        <div><span>Efectivo esperado</span><strong>{moneda(caja.total_esperado)}</strong></div>
                    </div>
                    <form className="caja-form" onSubmit={ejecutarCierre}>
                        <h3>Cerrar caja</h3>
                        <div className="caja-fields">
                            <label>Usuario de cierre<select value={usuarioCierre} onChange={(event) => setUsuarioCierre(event.target.value)} required><option value="">Selecciona usuario</option>{usuarios.map((usuario) => <option key={usuario.user_id} value={usuario.user_id}>{usuario.nombre}</option>)}</select></label>
                            <label>Efectivo contado<input type="number" min="0" step="0.01" value={montoReal} onChange={(event) => setMontoReal(event.target.value)} required /></label>
                            <label>Observaciones<input value={observaciones} onChange={(event) => setObservaciones(event.target.value)} /></label>
                        </div>
                        <button className="caja-primary" type="submit" disabled={guardando || !usuarioCierre}>{guardando ? "Cerrando…" : "Confirmar cierre"}</button>
                    </form>
                </div>
            ) : (
                <form className="caja-form caja-open-form" onSubmit={ejecutarApertura}>
                    <h3>Apertura de caja</h3>
                    <p>{caja?.estado === "Cerrada" ? `Último cierre: ${fechaHora(caja.fecha_cierre)} · ${moneda(caja.total_ventas)} cobrados.` : "No hay una caja abierta."}</p>
                    <div className="caja-fields">
                        <label>Usuario responsable<select value={usuarioApertura} onChange={(event) => setUsuarioApertura(event.target.value)} required><option value="">Selecciona usuario</option>{usuarios.map((usuario) => <option key={usuario.user_id} value={usuario.user_id}>{usuario.nombre}</option>)}</select></label>
                        <label>Monto inicial<input type="number" min="0" step="0.01" value={montoInicial} onChange={(event) => setMontoInicial(event.target.value)} required /></label>
                        <label>Observaciones<input value={observaciones} onChange={(event) => setObservaciones(event.target.value)} /></label>
                    </div>
                    <button className="caja-primary" type="submit" disabled={guardando || !usuarioApertura}>{guardando ? "Abriendo…" : "Abrir caja"}</button>
                </form>
            )}

            <div className="caja-history-wrap">
                <h3>Historial de cierres</h3>
                <div className="caja-table-scroll"><table className="caja-table"><thead><tr><th>Caja</th><th>Usuario</th><th>Apertura</th><th>Cierre</th><th>Efectivo</th><th>Tarjeta</th><th>Transferencia</th><th>Otros</th><th>Total</th><th>Operaciones</th><th>Diferencia</th><th>Estado</th></tr></thead>
                    <tbody>{cierres.length ? cierres.map((cierre) => <tr key={cierre.cierre_caja_id}><td>#{cierre.cierre_caja_id}</td><td>{cierre.usuario_nombre || cierre.usuario_id}</td><td>{fechaHora(cierre.fecha_apertura)}</td><td>{fechaHora(cierre.fecha_cierre)}</td><td>{moneda(cierre.total_efectivo)}</td><td>{moneda(cierre.total_tarjeta)}</td><td>{moneda(cierre.total_transferencia)}</td><td>{moneda(cierre.total_otros)}</td><td>{moneda(cierre.total_ventas)}</td><td>{cierre.cantidad_operaciones}</td><td>{moneda(cierre.diferencia)}</td><td>{cierre.estado}</td></tr>) : <tr><td colSpan="12" className="caja-empty">Sin cierres registrados.</td></tr>}</tbody>
                </table></div>
            </div>
        </section>
    );
}

export default Caja;
