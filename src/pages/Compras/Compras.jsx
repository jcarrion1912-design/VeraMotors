import { useState, useEffect } from "react";
import "./Compras.css";
import {
    obtenerCompras,
    crearCompra,
    obtenerDetallesCompra,
    obtenerRecepciones,
    registrarRecepcion
} from "../../services/comprasService";
import { obtenerProveedores } from "../../services/proveedoresService";
import { obtenerInventario } from "../../services/inventarioService";
import { useRole } from "../../context/authContext";
import { imprimirOrdenCompra } from "./imprimirOrdenCompra";
import FacturasProveedor from "./FacturasProveedor";

const SUBMENUS_COMPRAS = [
    "Órdenes de Compra",
    "Recepciones de Almacén",
    "Facturas de Proveedor"
];

const TASA_IGV = 0.18;
const ESTADOS_COMPRA = ["Registrada", "Recibida"];

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
    const [itemsInventario, setItemsInventario] = useState([]);
    const [recepciones, setRecepciones] = useState([]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [compras, provs, inventario, recepcionesData] = await Promise.all([
                obtenerCompras(),
                obtenerProveedores(),
                obtenerInventario().catch(() => []),
                obtenerRecepciones().catch(() => [])
            ]);
            setOrdenesCompra(compras);
            setProveedores(provs);
            setItemsInventario(Array.isArray(inventario) ? inventario.filter((i) => i.activo && i.tipo !== "Servicio") : []);
            setRecepciones(Array.isArray(recepcionesData) ? recepcionesData : []);
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
    const [itemIdSel, setItemIdSel] = useState("");
    const [itemCant, setItemCant] = useState("");
    const [itemCosto, setItemCosto] = useState("");

    const subtotalBruto = itemsCompra.reduce((t, i) => t + (i.cantidad * i.costoUnitario), 0);
    const igvCalculado = subtotalBruto * TASA_IGV;
    const totalCompra = subtotalBruto + igvCalculado;

    const seleccionarItem = (itemId) => {
        setItemIdSel(itemId);
        const item = itemsInventario.find((i) => String(i.item_id) === itemId);
        setItemCosto(item ? String(Number(item.costo_compra)) : "");
    };

    const agregarItemTabla = () => {
        const item = itemsInventario.find((i) => String(i.item_id) === itemIdSel);
        const cantidad = Number(itemCant);
        const costo = Number(itemCosto);
        if (!item || cantidad <= 0 || itemCosto === "" || costo < 0) return;

        setItemsCompra((actuales) => {
            const existente = actuales.find((i) => i.item_id === item.item_id);
            if (existente) {
                return actuales.map((i) => i.item_id === item.item_id
                    ? { ...i, cantidad: i.cantidad + cantidad, costoUnitario: costo }
                    : i);
            }
            return [...actuales, {
                item_id: item.item_id,
                codigo: item.codigo_referencia,
                descripcion: item.nombre_nomenclatura,
                cantidad,
                costoUnitario: costo
            }];
        });
        setItemIdSel("");
        setItemCant("");
        setItemCosto("");
    };

    const quitarItemTabla = (itemId) => {
        setItemsCompra((actuales) => actuales.filter((i) => i.item_id !== itemId));
    };

    const emitirOrdenCompra = async (e) => {
        e.preventDefault();
        if (!proveedorSel) {
            alert("Selecciona un proveedor.");
            return;
        }
        if (itemsCompra.length === 0) {
            alert("Agrega al menos un ítem a la orden de compra.");
            return;
        }
        try {
            if (!usuarioActual?.user_id) throw new Error("Inicia sesión para registrar la compra.");
            const nuevaCompra = {
                proveedor_id: proveedorSel,
                usuario_id: usuarioActual.user_id,
                subtotal: subtotalBruto,
                impuestos: igvCalculado,
                descuentos: 0,
                total: totalCompra,
                estado: "Registrada",
                detalles: itemsCompra.map((i) => {
                    const importe = i.cantidad * i.costoUnitario;
                    const impuesto = importe * TASA_IGV;
                    return {
                        item_id: i.item_id,
                        cantidad: i.cantidad,
                        precio_unitario: i.costoUnitario,
                        descuento: 0,
                        impuesto,
                        total: importe + impuesto
                    };
                })
            };
            await crearCompra(nuevaCompra);
            setMostrarModal(false);
            setItemsCompra([]);
            cargarDatos();
            alert("¡Orden de Compra registrada exitosamente!");
        } catch (error) {
            console.error("Error registrando compra:", error);
            alert(error.message || "Error al registrar la compra");
        }
    };

    // Recepción en almacén
    const [recepcionEnCurso, setRecepcionEnCurso] = useState(null);
    const [errorRecepcion, setErrorRecepcion] = useState("");
    const [guardandoRecepcion, setGuardandoRecepcion] = useState(false);
    const [ordenEnProceso, setOrdenEnProceso] = useState(null);

    const proveedorDe = (orden) =>
        proveedores.find((p) => Number(p.proveedor_id) === Number(orden.proveedor_id));

    const recepcionesDe = (orden) =>
        recepciones.filter((r) => Number(r.compra_id) === Number(orden.compra_id) && r.estado === "Confirmada");

    const abrirRecepcion = async (orden) => {
        setOrdenEnProceso(orden.compra_id);
        try {
            const detalles = await obtenerDetallesCompra(orden.compra_id);
            if (detalles.length === 0) {
                alert("Esta orden se registró sin ítems, por lo que no se puede recibir en stock. Ajusta el stock desde Inventario.");
                return;
            }

            const recibido = {};
            recepcionesDe(orden).forEach((r) => (r.detalles || []).forEach((d) => {
                recibido[d.item_id] = (recibido[d.item_id] || 0) + Number(d.cantidad_recibida);
            }));

            setErrorRecepcion("");
            setRecepcionEnCurso({
                orden,
                lineas: detalles.map((d) => {
                    const ordenada = Number(d.cantidad);
                    const previa = recibido[d.item_id] || 0;
                    const pendiente = Math.max(ordenada - previa, 0);
                    return {
                        item_id: d.item_id,
                        codigo: d.codigo_referencia,
                        descripcion: d.descripcion || `Ítem ${d.item_id}`,
                        precio: Number(d.precio_unitario),
                        ordenada,
                        pendiente,
                        recibir: String(pendiente)
                    };
                })
            });
        } catch (error) {
            console.error("Error preparando recepción:", error);
            alert(error.message || "No se pudo cargar el detalle de la orden.");
        } finally {
            setOrdenEnProceso(null);
        }
    };

    const cambiarCantidadRecibida = (itemId, valor) => {
        setRecepcionEnCurso((actual) => ({
            ...actual,
            lineas: actual.lineas.map((l) => l.item_id === itemId ? { ...l, recibir: valor } : l)
        }));
    };

    const confirmarRecepcion = async (e) => {
        e.preventDefault();
        const { orden, lineas } = recepcionEnCurso;
        const aRecibir = lineas.filter((l) => Number(l.recibir) > 0);

        if (aRecibir.length === 0) {
            setErrorRecepcion("Indica la cantidad recibida de al menos un ítem.");
            return;
        }
        if (aRecibir.some((l) => Number(l.recibir) > l.pendiente)) {
            setErrorRecepcion("Una cantidad recibida supera lo pendiente de la orden.");
            return;
        }

        setGuardandoRecepcion(true);
        setErrorRecepcion("");
        try {
            if (!usuarioActual?.user_id) throw new Error("Inicia sesión para registrar la recepción.");
            await registrarRecepcion({
                compra_id: orden.compra_id,
                proveedor_id: orden.proveedor_id,
                usuario_id: usuarioActual.user_id,
                estado: "Confirmada",
                confirmar: true,
                detalles: aRecibir.map((l) => ({
                    item_id: l.item_id,
                    descripcion: l.descripcion,
                    cantidad_ordenada: l.ordenada,
                    cantidad_recibida: Number(l.recibir),
                    cantidad_pendiente: l.pendiente - Number(l.recibir),
                    precio_unitario: l.precio,
                    total: Number(l.recibir) * l.precio
                }))
            });
            setRecepcionEnCurso(null);
            cargarDatos();
            alert("Recepción registrada y stock actualizado.");
        } catch (error) {
            console.error("Error registrando recepción:", error);
            setErrorRecepcion(error.message || "No se pudo registrar la recepción.");
        } finally {
            setGuardandoRecepcion(false);
        }
    };

    // PDF de la orden
    const verOrdenPdf = async (orden) => {
        setOrdenEnProceso(orden.compra_id);
        try {
            const detalles = await obtenerDetallesCompra(orden.compra_id);
            const abierta = imprimirOrdenCompra({ orden, proveedor: proveedorDe(orden), detalles });
            if (!abierta) alert("El navegador bloqueó la ventana. Permite ventanas emergentes para generar el PDF.");
        } catch (error) {
            console.error("Error generando ODC:", error);
            alert(error.message || "No se pudo generar la orden de compra.");
        } finally {
            setOrdenEnProceso(null);
        }
    };

    const ordenesFiltradas = ordenesCompra.filter(o =>
        estadoFiltro === "Todos" || o.estado === estadoFiltro
    );

    const estadosDisponibles = [...new Set([...ESTADOS_COMPRA, ...ordenesCompra.map((o) => o.estado)])];

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
                    Nueva Orden de Compra
                </button>
            </div>

            {/* PESTAÑAS HORIZONTALES */}
            <div className="reportes-tabs-nav">
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
            {submodulo === "Órdenes de Compra" && (
                <div className="os-filter-bar">
                    <div className="reportes-filter-item">
                        <label>Filtrar por Estado:</label>
                        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                            <option value="Todos">Todos los Estados</option>
                            {estadosDisponibles.map((estado) => (
                                <option key={estado} value={estado}>{estado}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* TABLA PRINCIPAL ÓRDENES DE COMPRA */}
            {submodulo === "Órdenes de Compra" && (
                <div className="os-table-wrapper">
                    <table className="os-table">
                        <thead>
                            <tr>
                                <th>N° ODC</th>
                                <th>Proveedor</th>
                                <th>Fecha Emisión</th>
                                <th className="vm-num">Subtotal</th>
                                <th className="vm-num">IGV (18%)</th>
                                <th className="vm-num">Total ODC (S/)</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordenesFiltradas.map(o => (
                                <tr key={o.compra_id}>
                                    <td><span className="vm-code">{o.codigo_compra}</span></td>
                                    <td>{proveedorDe(o)?.razon_social || "Proveedor no encontrado"}</td>
                                    <td>{new Date(o.fecha_compra).toLocaleDateString()}</td>
                                    <td className="vm-num">S/ {parseFloat(o.subtotal).toFixed(2)}</td>
                                    <td className="vm-num">S/ {parseFloat(o.impuestos).toFixed(2)}</td>
                                    <td className="vm-num"><strong>S/ {parseFloat(o.total).toFixed(2)}</strong></td>
                                    <td>
                                        <span className={`vm-badge ${o.estado === "Recibida" ? "vm-badge-success" : o.estado === "Registrada" ? "vm-badge-info" : "vm-badge-danger"}`}>
                                            {o.estado === "Registrada" && recepcionesDe(o).length > 0 ? "Recepción parcial" : o.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                className="btn-act-table link"
                                                disabled={ordenEnProceso === o.compra_id}
                                                onClick={() => verOrdenPdf(o)}
                                            >
                                                <span className="material-symbols-outlined">picture_as_pdf</span>
                                                ODC PDF
                                            </button>
                                            {o.estado !== "Recibida" && (
                                                <button
                                                    className="btn-act-table nps"
                                                    disabled={ordenEnProceso === o.compra_id}
                                                    onClick={() => abrirRecepcion(o)}
                                                >
                                                    <span className="material-symbols-outlined">inventory_2</span>
                                                    Recibir en Stock
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="vm-empty compras-tabla-vacia">
                        <span className="material-symbols-outlined">shopping_cart</span>
                        <strong>Sin órdenes de compra</strong>
                        <span>No hay órdenes para el estado seleccionado.</span>
                    </div>
                </div>
            )}

            {/* RECEPCIONES DE ALMACÉN */}
            {submodulo === "Recepciones de Almacén" && (
                <div className="os-table-wrapper">
                    <table className="os-table">
                        <thead>
                            <tr>
                                <th>N° Recepción</th>
                                <th>N° ODC</th>
                                <th>Proveedor</th>
                                <th>Fecha</th>
                                <th>Ítems</th>
                                <th className="vm-num">Unidades</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recepciones.map((r) => {
                                const orden = ordenesCompra.find((o) => Number(o.compra_id) === Number(r.compra_id));
                                const proveedor = proveedores.find((p) => Number(p.proveedor_id) === Number(r.proveedor_id));
                                const unidades = (r.detalles || []).reduce((t, d) => t + Number(d.cantidad_recibida), 0);
                                return (
                                    <tr key={r.recepcion_id}>
                                        <td><span className="vm-code">REC-{r.recepcion_id}</span></td>
                                        <td><span className="vm-code">{orden?.codigo_compra || `#${r.compra_id}`}</span></td>
                                        <td>{proveedor?.razon_social || "Proveedor no encontrado"}</td>
                                        <td>{new Date(r.fecha_recepcion).toLocaleDateString()}</td>
                                        <td>{(r.detalles || []).map((d) => d.descripcion).join(", ")}</td>
                                        <td className="vm-num">{unidades}</td>
                                        <td><span className="vm-badge vm-badge-success">{r.estado}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="vm-empty compras-tabla-vacia">
                        <span className="material-symbols-outlined">inventory_2</span>
                        <strong>Sin recepciones</strong>
                        <span>Las recepciones aparecen aquí al usar «Recibir en Stock» en una orden.</span>
                    </div>
                </div>
            )}

            {submodulo === "Facturas de Proveedor" && (
                <FacturasProveedor
                    proveedores={proveedores}
                    ordenesCompra={ordenesCompra}
                    usuarioActual={usuarioActual}
                />
            )}

            {/* MODAL NUEVA ORDEN DE COMPRA */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content compras-modal">
                        <div className="modal-header">
                            <div>
                                <h2>Nueva Orden de Compra (ODC)</h2>
                                <p>Selecciona proveedor e ingresa el detalle de insumos/repuestos a requerir.</p>
                            </div>
                            <button className="btn-close" aria-label="Cerrar" onClick={() => setMostrarModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={emitirOrdenCompra}>
                            <div className="modal-body">
                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">storefront</span>
                                    Proveedor
                                </div>
                                <div className="form-group">
                                    <label>Proveedor Homologado *</label>
                                    <select value={proveedorSel} onChange={(e) => setProveedorSel(e.target.value)}>
                                        <option value="">Selecciona proveedor</option>
                                        {proveedores.map(p => (
                                            <option key={p.proveedor_id} value={p.proveedor_id}>
                                                {p.razon_social}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">list_alt</span>
                                    Ítems Requeridos
                                </div>
                                <div className="vm-table-wrap compras-items">
                                    <table className="os-table">
                                        <thead>
                                            <tr>
                                                <th>Descripción</th>
                                                <th className="vm-num">Cant.</th>
                                                <th className="vm-num">Costo Unit (S/)</th>
                                                <th className="vm-num">Total (S/)</th>
                                                <th aria-label="Acciones"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemsCompra.map((it) => (
                                                <tr key={it.item_id}>
                                                    <td>
                                                        <span className="vm-code">{it.codigo}</span> {it.descripcion}
                                                    </td>
                                                    <td className="vm-num">{it.cantidad}</td>
                                                    <td className="vm-num">S/ {it.costoUnitario.toFixed(2)}</td>
                                                    <td className="vm-num"><strong>S/ {(it.cantidad * it.costoUnitario).toFixed(2)}</strong></td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn-act-table danger"
                                                            aria-label={`Quitar ${it.descripcion}`}
                                                            onClick={() => quitarItemTabla(it.item_id)}
                                                        >
                                                            <span className="material-symbols-outlined">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="vm-empty compras-items-vacio">
                                        <span>Aún no hay ítems. Agrégalos con el formulario de abajo.</span>
                                    </div>
                                </div>

                                {/* FORMULARIO AÑADIR ÍTEM */}
                                <div className="compras-item-form">
                                    <select aria-label="Ítem de inventario" value={itemIdSel} onChange={(e) => seleccionarItem(e.target.value)}>
                                        <option value="">Selecciona repuesto o insumo…</option>
                                        {itemsInventario.map((i) => (
                                            <option key={i.item_id} value={i.item_id}>
                                                {i.codigo_referencia} · {i.nombre_nomenclatura}
                                            </option>
                                        ))}
                                    </select>
                                    <input type="number" min="0.01" step="0.01" aria-label="Cantidad" placeholder="Cant" value={itemCant} onChange={(e) => setItemCant(e.target.value)} />
                                    <input type="number" min="0" step="0.01" aria-label="Costo unitario" placeholder="Costo S/" value={itemCosto} onChange={(e) => setItemCosto(e.target.value)} />
                                    <button type="button" className="vm-btn vm-btn-secondary" onClick={agregarItemTabla}>
                                        <span className="material-symbols-outlined">add</span>
                                        Añadir
                                    </button>
                                </div>

                                {/* RESUMEN FINANCIERO */}
                                <div className="compras-resumen">
                                    <div className="compras-resumen-fila">
                                        <span>Subtotal Bruto:</span>
                                        <span className="vm-num">S/ {subtotalBruto.toFixed(2)}</span>
                                    </div>
                                    <div className="compras-resumen-fila">
                                        <span>IGV (18%):</span>
                                        <span className="vm-num">S/ {igvCalculado.toFixed(2)}</span>
                                    </div>
                                    <div className="compras-resumen-fila compras-resumen-total">
                                        <span>TOTAL ORDEN DE COMPRA:</span>
                                        <span className="vm-num">S/ {totalCompra.toFixed(2)}</span>
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

            {/* MODAL RECIBIR EN STOCK */}
            {recepcionEnCurso && (
                <div className="modal-overlay">
                    <div className="modal-content compras-modal">
                        <div className="modal-header">
                            <div>
                                <h2>Recibir en Stock · {recepcionEnCurso.orden.codigo_compra}</h2>
                                <p>Confirma lo que llegó al almacén. Al registrar, se suma al stock de inventario.</p>
                            </div>
                            <button className="btn-close" aria-label="Cerrar" onClick={() => setRecepcionEnCurso(null)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={confirmarRecepcion}>
                            <div className="modal-body">
                                {errorRecepcion && (
                                    <div className="vm-alert" role="alert">
                                        <span className="material-symbols-outlined">error</span>
                                        <span>{errorRecepcion}</span>
                                    </div>
                                )}
                                <div className="vm-table-wrap compras-items">
                                    <table className="os-table">
                                        <thead>
                                            <tr>
                                                <th>Ítem</th>
                                                <th className="vm-num">Ordenado</th>
                                                <th className="vm-num">Pendiente</th>
                                                <th className="vm-num">Recibido ahora</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recepcionEnCurso.lineas.map((l) => (
                                                <tr key={l.item_id}>
                                                    <td><span className="vm-code">{l.codigo}</span> {l.descripcion}</td>
                                                    <td className="vm-num">{l.ordenada}</td>
                                                    <td className="vm-num">{l.pendiente}</td>
                                                    <td className="vm-num">
                                                        <input
                                                            type="number"
                                                            className="compras-cantidad"
                                                            aria-label={`Cantidad recibida de ${l.descripcion}`}
                                                            min="0"
                                                            max={l.pendiente}
                                                            step="0.01"
                                                            value={l.recibir}
                                                            disabled={l.pendiente === 0}
                                                            onChange={(e) => cambiarCantidadRecibida(l.item_id, e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setRecepcionEnCurso(null)}>Cancelar</button>
                                <button type="submit" className="btn-guardar" disabled={guardandoRecepcion}>
                                    {guardandoRecepcion ? "Registrando…" : "Registrar Recepción"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Compras;