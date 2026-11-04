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
            <header className="vm-page-head">
                <div><h2>Cuentas por cobrar</h2><p>Saldos y pagos registrados en PostgreSQL.</p></div>
                <label className="vm-search cxc-search">
                    <span className="material-symbols-outlined" aria-hidden="true">search</span>
                    <input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Comprobante o cliente" aria-label="Buscar" />
                </label>
            </header>
            {error && <div className="vm-alert" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span>{error}</div>}
            <div className="vm-kpi-grid" aria-live="polite">
                <div className="vm-kpi"><span className="vm-kpi-label">Saldo pendiente</span><strong className="vm-kpi-value">{moneda(saldoTotal)}</strong></div>
                <div className="vm-kpi"><span className="vm-kpi-label">Cuentas abiertas</span><strong className="vm-kpi-value">{cuentasAbiertas}</strong></div>
                <div className="vm-kpi"><span className="vm-kpi-label">Comprobantes</span><strong className="vm-kpi-value">{cuentas.length}</strong></div>
            </div>
            <div className="vm-table-wrap">
                <table className="vm-table cxc-table">
                    <thead>
                        <tr>
                            <th>Factura</th>
                            <th>Cliente</th>
                            <th>Emisión</th>
                            <th>Vencimiento</th>
                            <th className="vm-num">Total</th>
                            <th className="vm-num">Pagado</th>
                            <th className="vm-num">Saldo</th>
                            <th>Estado</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? <tr><td colSpan="9"><div className="vm-loading cxc-loading">Consultando cuentas…</div></td></tr> : cuentasFiltradas.length === 0 ? <tr><td colSpan="9"><div className="vm-empty"><span className="material-symbols-outlined" aria-hidden="true">account_balance_wallet</span><strong>No hay cuentas para mostrar.</strong></div></td></tr> : cuentasFiltradas.map((cuenta) => (
                            <tr key={cuenta.cuenta_cobrar_id}>
                                <td><span className="vm-code">{cuenta.numero_comprobante}</span><small className="cxc-doc-type">{cuenta.tipo_comprobante}</small></td>
                                <td>{cuenta.cliente_nombre}</td>
                                <td>{fecha(cuenta.fecha_emision)}</td>
                                <td>{fecha(cuenta.fecha_vencimiento)}</td>
                                <td className="vm-num">{moneda(cuenta.monto_total)}</td>
                                <td className="vm-num">{moneda(cuenta.monto_pagado)}</td>
                                <td className="vm-num"><strong>{moneda(cuenta.saldo)}</strong></td>
                                <td><span className={`vm-badge cxc-state-${cuenta.estado.toLowerCase()}`}>{cuenta.estado}</span></td>
                                <td>{Number(cuenta.saldo) > 0 && cuenta.estado !== "Anulada" ? <button type="button" className="btn-act-table link" onClick={() => onCobrar(cuenta)}><span className="material-symbols-outlined" aria-hidden="true">payments</span>Cobrar</button> : <span className="cxc-no-action">-</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default CuentasPorCobrar;
