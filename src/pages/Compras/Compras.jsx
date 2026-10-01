import { useState, useEffect } from "react";
import "./Compras.css";
import { obtenerCompras, crearCompra } from "../../services/comprasService";
import { obtenerProveedores } from "../../services/proveedoresService";
import { useRole } from "../../context/authContext";

const SUBMENUS_COMPRAS = [
    "Órdenes de Compra",
    "Recepciones de Almacén",
    "Facturas de Proveedor"
];

function Compras() {
    const { usuarioActual } = useRole();
    const [submodulo, setSubmodulo] = useState("Órdenes de Compra");
    const [estadoFiltro, setEstadoFiltro] = useState("Todos");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [proveedorSel, setProveedorSel] = useState("");

    // Órdenes de Compra
    const [ordenesCompra, setOrdenesCompra] = useState([]);
    const [proveedores, setProveedores] = useState([]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [compras, provs] = await Promise.all([
                obtenerCompras(),
                obtenerProveedores()
            ]);
            setOrdenesCompra(compras);
            setProveedores(provs);
            setProveedorSel((actual) => actual || String(provs[0]?.proveedor_id || ""));
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        let activa = true;
        queueMicrotask(() => { if (activa) cargarDatos(); });
        return () => { activa = false; };
    }, []);

    // Modal Nueva Compra
    const [itemsCompra, setItemsCompra] = useState([]);
    const [itemDesc, setItemDesc] = useState("");
    const [itemCant, setItemCant] = useState("");
    const [itemCosto, setItemCosto] = useState("");

    const subtotalBruto = itemsCompra.reduce((t, i) => t + (i.cantidad * i.costoUnitario), 0);
    const igvCalculado = subtotalBruto * 0.18;
    const totalCompra = subtotalBruto + igvCalculado;

    const agregarItemTabla = () => {
        if (!itemDesc || !itemCant || !itemCosto) return;
        setItemsCompra([...itemsCompra, { descripcion: itemDesc, cantidad: Number(itemCant), costoUnitario: Number(itemCosto) }]);
        setItemDesc("");
        setItemCant("");
        setItemCosto("");
    };

    const emitirOrdenCompra = async (e) => {
        e.preventDefault();
        try {
            if (!usuarioActual?.user_id) throw new Error("Inicia sesión para registrar la compra.");
            const nuevaCompra = {
                proveedor_id: proveedorSel,
                usuario_id: usuarioActual.user_id,
                subtotal: subtotalBruto,
                impuestos: igvCalculado,
                descuentos: 0,
                total: totalCompra,
                estado: "Registrada"
            };
            await crearCompra(nuevaCompra);
            setMostrarModal(false);
            setItemsCompra([]);
            cargarDatos();
            alert("¡Orden de Compra registrada exitosamente!");
        } catch (error) {
            console.error("Error registrando compra:", error);
            alert("Error al registrar la compra");
        }
    };

    const ordenesFiltradas = ordenesCompra.filter(o =>
        estadoFiltro === "Todos" || o.estado === estadoFiltro
    );

    return (
        <div className="compras-page">

            {cargando && <p role="status">Consultando compras y proveedores…</p>}

            {/* CABECERA */}
            <div className="compras-header">
                <div>
                    <h2>Gestión de Compras y Abastecimiento</h2>
                    <p>Órdenes de compra a proveedores, recepciones de insumos y facturas de entrada de VeraMotors SAC.</p>
                </div>

                <button className="btn-nueva-compra" onClick={() => setMostrarModal(true)}>
                    <span className="material-symbols-outlined">shopping_cart_checkout</span>
                    + Nueva Orden de Compra
                </button>
            </div>

            {/* PESTAÑAS HORIZONTALES */}
            <div className="reportes-tabs-nav" style={{ marginBottom: '16px' }}>
                {SUBMENUS_COMPRAS.map(tab => (
                    <button
                        key={tab}
                        className={`reportes-tab-btn ${submodulo === tab ? "active" : ""}`}
                        onClick={() => setSubmodulo(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* BARRA DE FILTROS DE ESTADO */}
            <div className="os-filter-bar" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Filtrar por Estado:</label>
                <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="Todos">Todos los Estados</option>
                    <option value="Solicitado">Solicitado</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Recibido">Recibido en Almacén</option>
                    <option value="Pagado">Pagado</option>
                </select>
            </div>

            {/* TABLA PRINCIPAL ÓRDENES DE COMPRA */}
            {submodulo === "Órdenes de Compra" && (
                <div className="os-table-wrapper">
                    <table className="os-table">
                        <thead>
                            <tr>
                                <th>N° ODC</th>
                                <th>Proveedor</th>
                                <th>Fecha Emisión</th>
                                <th>Fecha Entrega Est.</th>
                                <th>Subtotal</th>
                                <th>IGV (18%)</th>
                                <th>Total ODC (S/)</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordenesFiltradas.map(o => (
                                <tr key={o.compra_id}>
                                    <td><strong>{o.codigo_compra}</strong></td>
                                    <td>{o.proveedor?.razon_social || 'Proveedor'}</td>
                                    <td>{new Date(o.fecha_compra).toLocaleDateString()}</td>
                                    <td>{new Date(o.fecha_compra).toLocaleDateString()}</td>
                                    <td>S/ {parseFloat(o.subtotal).toFixed(2)}</td>
                                    <td>S/ {parseFloat(o.impuestos).toFixed(2)}</td>
                                    <td><strong>S/ {parseFloat(o.total).toFixed(2)}</strong></td>
                                    <td>
                                        <span className={`proc-tag ${o.estado === "Recibida" ? "preventivo" : o.estado === "Registrada" ? "link" : "correctivo"}`}>
                                            {o.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-act-table link">📄 ODC PDF</button>
                                            {o.estado !== "Recibida" && (
                                                <button className="btn-act-table nps" onClick={() => {
                                                    console.log("Recibir compra:", o.compra_id);
                                                }}>
                                                    📦 Recibir en Stock
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {submodulo !== "Órdenes de Compra" && (
                <div style={{ background: '#ffffff', padding: '40px', textAlign: 'center', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                    <h3>Módulo de {submodulo}</h3>
                    <p>Historial unificado y trazabilidad fiscal de {submodulo.toLowerCase()} de proveedores.</p>
                </div>
            )}

            {/* MODAL NUEVA ORDEN DE COMPRA */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content compras-modal" style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <div>
                                <h2>Nueva Orden de Compra (ODC)</h2>
                                <p>Selecciona proveedor e ingresa el detalle de insumos/repuestos a requerir.</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModal(false)}>✕</button>
                        </div>

                        <form onSubmit={emitirOrdenCompra}>
                            <div className="modal-body">
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Proveedor Homologado *</label>
                                    <select value={proveedorSel} onChange={(e) => setProveedorSel(e.target.value)}>
                                        <option value="">Selecciona proveedor</option>
                                        {proveedores.map(p => (
                                            <option key={p.proveedor_id} value={p.proveedor_id}>
                                                {p.razon_social}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <h4>Ítems Requeridos</h4>
                                <table className="os-table" style={{ marginBottom: '12px' }}>
                                    <thead>
                                        <tr>
                                            <th>Descripción</th>
                                            <th>Cant.</th>
                                            <th>Costo Unit (S/)</th>
                                            <th>Total (S/)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsCompra.map((it, idx) => (
                                            <tr key={idx}>
                                                <td>{it.descripcion}</td>
                                                <td>{it.cantidad}</td>
                                                <td>S/ {it.costoUnitario.toFixed(2)}</td>
                                                <td><strong>S/ {(it.cantidad * it.costoUnitario).toFixed(2)}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* FORMULARIO AÑADIR ÍTEM */}
                                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                    <input type="text" placeholder="Descripción de repuesto/insumo..." value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} style={{ flex: 2 }} />
                                    <input type="number" placeholder="Cant" value={itemCant} onChange={(e) => setItemCant(e.target.value)} style={{ flex: 1 }} />
                                    <input type="number" placeholder="Costo S/" value={itemCosto} onChange={(e) => setItemCosto(e.target.value)} style={{ flex: 1 }} />
                                    <button type="button" className="btn-act-table link" onClick={agregarItemTabla}>+ Añadir</button>
                                </div>

                                {/* RESUMEN FINANCIERO */}
                                <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                        <span>Subtotal Bruto:</span>
                                        <span>S/ {subtotalBruto.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: '#2563eb' }}>
                                        <span>IGV (18%):</span>
                                        <span>S/ {igvCalculado.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold', color: '#16a34a' }}>
                                        <span>TOTAL ORDEN DE COMPRA:</span>
                                        <span>S/ {totalCompra.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setMostrarModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-guardar">Emitir Orden de Compra</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Compras;