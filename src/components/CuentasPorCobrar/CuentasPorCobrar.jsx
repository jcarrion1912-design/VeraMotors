import { useEffect, useMemo, useState } from "react";
import { obtenerCuentasPorCobrar } from "../../services/cobrosService";
import "./CuentasPorCobrar.css";

const moneda = (valor) => Number(valor || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" });
const fecha = (valor) => valor ? new Date(valor).toLocaleDateString("es-PE") : "-";

function CuentasPorCobrar({ onCobrar, refreshKey = 0 }) {
    const [cuentas, setCuentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {
        let activa = true;
        obtenerCuentasPorCobrar()
            .then((data) => {
                if (activa) setCuentas(data);
            })
            .catch((loadError) => {
                if (activa) setError(loadError.message || "No se pudieron cargar las cuentas por cobrar.");
            })
            .finally(() => {
                if (activa) setCargando(false);
            });
        return () => {
            activa = false;
        };
    }, [refreshKey]);

    const cuentasFiltradas = useMemo(() => {
        const query = busqueda.trim().toLowerCase();
        return cuentas.filter((cuenta) =>
            !query || cuenta.numero_comprobante.toLowerCase().includes(query) || cuenta.cliente_nombre.toLowerCase().includes(query)
        );
    }, [busqueda, cuentas]);
    const saldoTotal = cuentas.reduce((total, cuenta) => total + Number(cuenta.saldo), 0);
    const cuentasAbiertas = cuentas.filter((cuenta) => Number(cuenta.saldo) > 0 && cuenta.estado !== "Anulada").length;

    return (
        <section className="cxc-page">
            <header className="cxc-header">
                <div><h2>Cuentas por cobrar</h2><p>Saldos y pagos registrados en PostgreSQL.</p></div>
                <label className="cxc-search">Buscar
                    <input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Comprobante o cliente" />
                </label>
            </header>
            {error && <div className="cxc-alert" role="alert">{error}</div>}
            <div className="cxc-summary" aria-live="polite">
                <div><span>Saldo pendiente</span><strong>{moneda(saldoTotal)}</strong></div>
                <div><span>Cuentas abiertas</span><strong>{cuentasAbiertas}</strong></div>
                <div><span>Comprobantes</span><strong>{cuentas.length}</strong></div>
            </div>
            <div className="cxc-table-wrap">
                <table className="cxc-table">
                    <thead><tr><th>Factura</th><th>Cliente</th><th>Emisión</th><th>Vencimiento</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th><th>Acción</th></tr></thead>
                    <tbody>
                        {cargando ? <tr><td colSpan="9" className="cxc-empty">Consultando cuentas…</td></tr> : cuentasFiltradas.length === 0 ? <tr><td colSpan="9" className="cxc-empty">No hay cuentas para mostrar.</td></tr> : cuentasFiltradas.map((cuenta) => (
                            <tr key={cuenta.cuenta_cobrar_id}>
                                <td><strong>{cuenta.numero_comprobante}</strong><small>{cuenta.tipo_comprobante}</small></td>
                                <td>{cuenta.cliente_nombre}</td>
                                <td>{fecha(cuenta.fecha_emision)}</td>
                                <td>{fecha(cuenta.fecha_vencimiento)}</td>
                                <td>{moneda(cuenta.monto_total)}</td>
                                <td>{moneda(cuenta.monto_pagado)}</td>
                                <td><strong>{moneda(cuenta.saldo)}</strong></td>
                                <td><span className={`cxc-state cxc-state-${cuenta.estado.toLowerCase()}`}>{cuenta.estado}</span></td>
                                <td>{Number(cuenta.saldo) > 0 && cuenta.estado !== "Anulada" ? <button type="button" onClick={() => onCobrar(cuenta)}>Cobrar</button> : <span>-</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default CuentasPorCobrar;
