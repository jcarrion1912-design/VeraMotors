import { useState } from "react";
import "./Facturacion.css";

const SUBMENUS_FACTURACION = [
    "Facturas",
    "Notas de Crédito",
    "Cuentas por Cobrar",
    "Cotizaciones",
    "Remisiones",
    "Cierre de Caja"
];

function Facturacion() {
    const [submodulo, setSubmodulo] = useState("Facturas");
    const [mostrarWizard, setMostrarWizard] = useState(false);
    const [pasoWizard, setPasoWizard] = useState(1);

    // Estado del Wizard "Nueva Factura"
    const [clienteFactura, setClienteFactura] = useState("Carlos Mendoza");
    const [vehiculoFactura, setVehiculoFactura] = useState("Toyota Corolla (ABC-123)");
    const [odsSeleccionada, setOdsSeleccionada] = useState("ODS-1001");
    const [metodoPago, setMetodoPago] = useState("Yape");
    const [observacionesPago, setObservacionesPago] = useState("Pago realizado vía Yape tras la entrega del vehículo.");

    const [itemsFactura, setItemsFactura] = useState([
        { id: 1, descripcion: "Servicio Mantenimiento Preventivo 80k km", cantidad: 1, precioUnitario: 350.00, descuento: 0 },
        { id: 2, descripcion: "Pastillas de Freno Brembo BRK-892-C", cantidad: 2, precioUnitario: 85.00, descuento: 10.00 }
    ]);

    const [nuevoItemDesc, setNuevoItemDesc] = useState("");
    const [nuevoItemPrecio, setNuevoItemPrecio] = useState("");

    // Tablas Simuladas
    const facturasList = [
        { id: "FAC-001-0892", fecha: "2026-08-23", vencimiento: "2026-08-23", cliente: "Carlos Mendoza", placa: "ABC-123", valor: 510.00, recibido: 510.00, saldo: 0.00, estado: "Pagado" },
        { id: "FAC-001-0893", fecha: "2026-08-22", vencimiento: "2026-09-22", cliente: "Talleres Industriales S.A.", placa: "GHI-321", valor: 2450.00, recibido: 1000.00, saldo: 1450.00, estado: "Pendiente" }
    ];

    const cotizacionesList = [
        { id: "COT-5501", fecha: "2026-08-20", cliente: "Carlos Mendoza", placa: "ABC-123", valor: 650.00, estado: "Aprobada" },
        { id: "COT-5502", fecha: "2026-08-21", cliente: "Elena Rojas", placa: "DEF-789", valor: 850.00, estado: "Pendiente" }
    ];

    // Cálculos Financieros del Wizard
    const subtotalBruto = itemsFactura.reduce((t, i) => t + (i.cantidad * i.precioUnitario), 0);
    const totalDescuentos = itemsFactura.reduce((t, i) => t + (i.descuento || 0), 0);
    const baseImponible = (subtotalBruto - totalDescuentos) / 1.18;
    const igvMonto = (subtotalBruto - totalDescuentos) - baseImponible;
    const totalPagar = subtotalBruto - totalDescuentos;

    const agregarItemManual = () => {
        if (!nuevoItemDesc || !nuevoItemPrecio) return;
        const nItem = {
            id: Date.now(),
            descripcion: nuevoItemDesc,
            cantidad: 1,
            precioUnitario: Number(nuevoItemPrecio),
            descuento: 0
        };
        setItemsFactura([...itemsFactura, nItem]);
        setNuevoItemDesc("");
        setNuevoItemPrecio("");
    };

    const emitirFacturaFinal = () => {
        alert(`¡Factura electrónica emitida exitosamente con el método ${metodoPago}! Comprobante listo para impresión/envío SUNAT.`);
        setMostrarWizard(false);
        setPasoWizard(1);
    };

    return (
        <div className="facturacion-page">

            {/* CABECERA & NAVEGACIÓN DE SUBMÓDULOS */}
            <div className="facturacion-header">
                <div>
                    <h2>Ingresos y Facturación Electrónica</h2>
                    <p>Gestión comercial, cotizaciones, cobranzas y comprobantes SUNAT de VeraMotors.</p>
                </div>

                <div className="facturacion-header-actions">
                    <button className="btn-nueva-factura" onClick={() => { setMostrarWizard(true); setPasoWizard(1); }}>
                        <span className="material-symbols-outlined">receipt_long</span>
                        + Nueva Factura (Wizard)
                    </button>
                </div>
            </div>

            {/* PESTAÑAS HORIZONTALES */}
            <div className="fact-tabs-nav">
                {SUBMENUS_FACTURACION.map(sub => (
                    <button
                        key={sub}
                        className={`fact-tab-btn ${submodulo === sub ? "active" : ""}`}
                        onClick={() => setSubmodulo(sub)}
                    >
                        {sub}
                    </button>
                ))}
            </div>

            {/* VISTA SEGÚN SUBMÓDULO SELECCIONADO */}
            {submodulo === "Facturas" && (
                <div className="os-table-wrapper" style={{ marginTop: '16px' }}>
                    <table className="os-table">
                        <thead>
                            <tr>
                                <th>N° Factura</th>
                                <th>Fecha Emisión</th>
                                <th>Vencimiento</th>
                                <th>Cliente</th>
                                <th>Placa</th>
                                <th>Valor Total</th>
                                <th>Recibido</th>
                                <th>Saldo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facturasList.map(f => (
                                <tr key={f.id}>
                                    <td><strong>{f.id}</strong></td>
                                    <td>{f.fecha}</td>
                                    <td>{f.vencimiento}</td>
                                    <td>{f.cliente}</td>
                                    <td>{f.placa}</td>
                                    <td><strong>S/ {f.valor.toFixed(2)}</strong></td>
                                    <td>S/ {f.recibido.toFixed(2)}</td>
                                    <td><span style={{ color: f.saldo > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>S/ {f.saldo.toFixed(2)}</span></td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-act-table link">🖨️ PDF</button>
                                            <button className="btn-act-table diag">✉️ Mail</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {submodulo === "Cotizaciones" && (
                <div className="os-table-wrapper" style={{ marginTop: '16px' }}>
                    <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Lista de Cotizaciones</h3>
                        <button className="btn-act-table link" style={{ padding: '8px 16px' }}>+ Nueva Cotización</button>
                    </div>
                    <table className="os-table">
                        <thead>
                            <tr>
                                <th>ID Cotización</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Placa</th>
                                <th>Valor Total</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cotizacionesList.map(c => (
                                <tr key={c.id}>
                                    <td><strong>{c.id}</strong></td>
                                    <td>{c.fecha}</td>
                                    <td>{c.cliente}</td>
                                    <td>{c.placa}</td>
                                    <td>S/ {c.valor.toFixed(2)}</td>
                                    <td><span className={`proc-tag ${c.estado === "Aprobada" ? "preventivo" : "correctivo"}`}>{c.estado}</span></td>
                                    <td>
                                        <button className="btn-act-table nps">Facturar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {["Notas de Crédito", "Cuentas por Cobrar", "Remisiones", "Cierre de Caja"].includes(submodulo) && (
                <div style={{ background: '#ffffff', padding: '40px', textAlign: 'center', borderRadius: '8px', marginTop: '16px', color: '#64748b', border: '1px solid #e2e8f0' }}>
                    <h3>Módulo Comercial - {submodulo}</h3>
                    <p>Filtros y reportes unificados de {submodulo.toLowerCase()} listos para emisión.</p>
                </div>
            )}

            {/* =========================================
                WIZARD "NUEVA FACTURA" (3 PASOS ESTRICTOS)
            ========================================= */}
            {mostrarWizard && (
                <div className="modal-overlay">
                    <div className="modal-content wizard-modal" style={{ maxWidth: '750px' }}>
                        
                        {/* WIZARD HEADER & PASOS */}
                        <div className="modal-header">
                            <div>
                                <h2>Wizard de Emisión de Factura Electrónica</h2>
                                <p>Paso {pasoWizard} de 3 - {pasoWizard === 1 ? "Selección de Cliente / ODS" : pasoWizard === 2 ? "Carga e Detalle de Ítems" : "Método de Pago & Emisión"}</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarWizard(false)}>✕</button>
                        </div>

                        {/* BARRA PASOS DE NAVEGACIÓN */}
                        <div className="wizard-steps-bar" style={{ display: 'flex', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                            <div className={`step-item ${pasoWizard === 1 ? "active" : ""}`} style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                1. Selección Cliente/ODS
                            </div>
                            <div className={`step-item ${pasoWizard === 2 ? "active" : ""}`} style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                2. Ítems & Venta
                            </div>
                            <div className={`step-item ${pasoWizard === 3 ? "active" : ""}`} style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                3. Pago & Emisión
                            </div>
                        </div>

                        <div className="modal-body">
                            
                            {/* PASO 1: SELECCIÓN */}
                            {pasoWizard === 1 && (
                                <div>
                                    <div className="form-group" style={{ marginBottom: '14px' }}>
                                        <label>Seleccionar Cliente / RUC *</label>
                                        <input type="text" value={clienteFactura} onChange={(e) => setClienteFactura(e.target.value)} placeholder="Buscar cliente..." />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '14px' }}>
                                        <label>Vehículo / Placa *</label>
                                        <input type="text" value={vehiculoFactura} onChange={(e) => setVehiculoFactura(e.target.value)} />
                                    </div>

                                    <div className="form-group">
                                        <label>Cargar Ítems desde Orden de Servicio (ODS) o Cotización</label>
                                        <select value={odsSeleccionada} onChange={(e) => setOdsSeleccionada(e.target.value)}>
                                            <option value="ODS-1001">ODS-1001 (Toyota Corolla ABC-123 - S/ 510.00)</option>
                                            <option value="ODS-1004">ODS-1004 (Ford Transit XYZ-987 - S/ 350.00)</option>
                                            <option value="Manual">Sin ODS (Facturación Directa)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* PASO 2: VENTA E ÍTEMS */}
                            {pasoWizard === 2 && (
                                <div>
                                    <h4 style={{ color: '#0f172a' }}>Detalle de Ítems a Facturar</h4>

                                    <table className="os-table" style={{ marginTop: '10px', marginBottom: '15px' }}>
                                        <thead>
                                            <tr>
                                                <th>Descripción</th>
                                                <th>Cant.</th>
                                                <th>Precio Unit.</th>
                                                <th>Desc.</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemsFactura.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.descripcion}</td>
                                                    <td>{item.cantidad}</td>
                                                    <td>S/ {item.precioUnitario.toFixed(2)}</td>
                                                    <td>S/ {item.descuento.toFixed(2)}</td>
                                                    <td><strong>S/ {((item.cantidad * item.precioUnitario) - item.descuento).toFixed(2)}</strong></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* AGREGAR ÍTEM MANUAL */}
                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Agregar ítem manual..." 
                                            value={nuevoItemDesc} 
                                            onChange={(e) => setNuevoItemDesc(e.target.value)}
                                            style={{ flex: 2 }}
                                        />
                                        <input 
                                            type="number" 
                                            placeholder="Precio S/" 
                                            value={nuevoItemPrecio} 
                                            onChange={(e) => setNuevoItemPrecio(e.target.value)}
                                            style={{ flex: 1 }}
                                        />
                                        <button type="button" className="btn-act-table link" onClick={agregarItemManual}>+ Añadir</button>
                                    </div>
                                </div>
                            )}

                            {/* PASO 3: PAGO Y RESUMEN FINANCIERO */}
                            {pasoWizard === 3 && (
                                <div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <div className="form-group" style={{ marginBottom: '12px' }}>
                                                <label>Método de Pago *</label>
                                                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                                                    <option value="Efectivo">Efectivo</option>
                                                    <option value="Crédito">Crédito (15 / 30 Días)</option>
                                                    <option value="Transferencia">Transferencia Bancaria</option>
                                                    <option value="Tarjeta Débito/Crédito">Tarjeta Débito/Crédito</option>
                                                    <option value="Yape">Yape</option>
                                                    <option value="Plin">Plin</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label>Observaciones de Pago</label>
                                                <textarea rows="3" value={observacionesPago} onChange={(e) => setObservacionesPago(e.target.value)} />
                                            </div>
                                        </div>

                                        {/* RESUMEN FINANCIERO CON IGV */}
                                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a' }}>
                                            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', color: '#0f172a' }}>Resumen Financiero</h4>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', margin: '4px 0', color: '#475569' }}>
                                                <span>Subtotal Bruto:</span>
                                                <span>S/ {subtotalBruto.toFixed(2)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', margin: '4px 0', color: '#dc2626' }}>
                                                <span>Descuentos:</span>
                                                <span>- S/ {totalDescuentos.toFixed(2)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', margin: '4px 0', color: '#475569' }}>
                                                <span>Base Imponible:</span>
                                                <span>S/ {baseImponible.toFixed(2)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', margin: '4px 0', color: '#2563eb' }}>
                                                <span>IGV (18%):</span>
                                                <span>S/ {igvMonto.toFixed(2)}</span>
                                            </div>
                                            <hr style={{ borderColor: '#cbd5e1', margin: '10px 0' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', color: '#16a34a' }}>
                                                <span>TOTAL A PAGAR:</span>
                                                <span>S/ {totalPagar.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* WIZARD FOOTER NAVEGACIÓN */}
                        <div className="modal-footer">
                            {pasoWizard > 1 && (
                                <button type="button" className="btn-cancelar" onClick={() => setPasoWizard(pasoWizard - 1)}>
                                    ◀ Anterior
                                </button>
                            )}

                            {pasoWizard < 3 ? (
                                <button type="button" className="btn-guardar" onClick={() => setPasoWizard(pasoWizard + 1)}>
                                    Siguiente ▶
                                </button>
                            ) : (
                                <button type="button" className="btn-approve" onClick={emitirFacturaFinal}>
                                    🧾 Emitir Factura Electrónica
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

export default Facturacion;