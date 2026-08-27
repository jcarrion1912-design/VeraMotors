import { useState, useEffect } from "react";
import "./Inventario.css";

const API_URL = "http://127.0.0.1:8000/api";

function Inventario() {
    const [submodulo, setSubmodulo] = useState("Ítem de venta");
    const [categoria, setCategoria] = useState("Todos");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [mostrarAyudaNomenclatura, setMostrarAyudaNomenclatura] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(false);

    const [productos, setProductos] = useState([]);

    const cargarInventario = async () => {
        try {
            setCargando(true);
            const res = await fetch(`${API_URL}/inventario`);
            if (res.ok) {
                const data = await res.json();
                const transformados = data.map((item) => ({
                    id: item.item_id,
                    tipo: item.tipo,
                    nombre: item.nombre_nomenclatura,
                    codigo: item.codigo_referencia,
                    unidad: item.unidad_medida,
                    marca: "VeraMotors",
                    categoria: item.categoria_nombre || "General",
                    stock: 50,
                    minimo: 10,
                    costo: Number(item.costo_compra || 0),
                    precio: Number(item.precio_venta || 0),
                    igv: "18%"
                }));
                setProductos(transformados);
            }
        } catch (error) {
            console.error("Error cargando inventario:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarInventario();
    }, []);

    const [nuevoProducto, setNuevoProducto] = useState({
        tipo: "Repuesto",
        nombre: "",
        codigo: "",
        categoria_id: 1,
        unidad: "Unidad",
        marca: "",
        costo: "",
        precio: "",
        stock: "",
        minimo: "",
        igv: "18%"
    });

    const totalProductos = productos.reduce((t, p) => t + Number(p.stock), 0);
    const productosStockBajo = productos.filter((p) => p.stock <= p.minimo).length;
    const valorInventario = productos.reduce((t, p) => t + (p.stock * p.precio), 0);

    const productosFiltrados = productos.filter((p) => {
        const coincideCategoria = categoria === "Todos" || p.categoria === categoria;
        const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo.toLowerCase().includes(busqueda.toLowerCase());
        return coincideCategoria && coincideBusqueda;
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNuevoProducto({ ...nuevoProducto, [name]: value });
    };

    const agregarProducto = async (e) => {
        e.preventDefault();
        if (!nuevoProducto.nombre || !nuevoProducto.codigo || !nuevoProducto.precio) {
            alert("Por favor completa los campos obligatorios.");
            return;
        }

        try {
            const body = {
                tipo: nuevoProducto.tipo,
                categoria_id: Number(nuevoProducto.categoria_id) || 1,
                codigo_referencia: nuevoProducto.codigo,
                nombre_nomenclatura: nuevoProducto.nombre,
                unidad_medida: nuevoProducto.unidad,
                costo_compra: Number(nuevoProducto.costo) || 0,
                margen_ganancia: 30,
                precio_venta: Number(nuevoProducto.precio),
                impuesto: 18
            };

            const res = await fetch(`${API_URL}/inventario`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Error al crear el ítem.");
            }

            alert("¡Ítem registrado en inventario exitosamente en PostgreSQL!");
            setMostrarFormulario(false);
            setNuevoProducto({
                tipo: "Repuesto", nombre: "", codigo: "", categoria_id: 1, unidad: "Unidad", marca: "", costo: "", precio: "", stock: "", minimo: "", igv: "18%"
            });
            await cargarInventario();
        } catch (error) {
            console.error("Error agregando item:", error);
            alert(error.message || "Error al registrar en base de datos.");
        }
    };

    const exportarExcel = () => {
        alert("Simulando exportación de Inventario a Excel (.xlsx)... Descarga completada.");
    };

    const importarExcel = () => {
        alert("Simulando importación de Inventario desde CSV / Excel...");
    };

    return (
        <div className="inventario-page">

            {/* CABECERA & SUBMENÚ DE INVENTARIO */}
            <div className="inventario-header">
                <div>
                    <h2>Inventario de Repuestos e Insumos</h2>
                    <p>Catálogo unificado de ítems de venta, planta/equipo y categorías de VeraMotors.</p>
                </div>

                <div className="inventario-header-actions">
                    <button className="btn-filtrar" onClick={importarExcel}>
                        <span className="material-symbols-outlined">file_upload</span>
                        Importar CSV/Excel
                    </button>

                    <button className="btn-filtrar" onClick={exportarExcel}>
                        <span className="material-symbols-outlined">file_download</span>
                        Exportar Excel
                    </button>

                    <button className="btn-nuevo-producto" onClick={() => setMostrarFormulario(true)}>
                        <span className="material-symbols-outlined">add</span>
                        Nuevo Ítem
                    </button>
                </div>
            </div>

            {/* PESTAÑAS SUBMÓDULO INVENTARIO */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '16px' }}>
                {["Ítem de venta", "Planta y equipo", "Categorías"].map(tab => (
                    <button
                        key={tab}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            background: submodulo === tab ? '#2563eb' : '#f1f5f9',
                            color: submodulo === tab ? '#ffffff' : '#475569',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                        onClick={() => setSubmodulo(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* TARJETAS KPI RESUMEN */}
            <div className="stats-inventario" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div className="stat-inv-card" style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Ítems en Stock</span>
                    <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', color: '#0f172a' }}>{totalProductos}</h3>
                </div>
                <div className="stat-inv-card" style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Alertas de Stock Bajo</span>
                    <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', color: '#ef4444' }}>{productosStockBajo} ítems</h3>
                </div>
                <div className="stat-inv-card" style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Valor Total del Inventario</span>
                    <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', color: '#16a34a' }}>S/ {valorInventario.toFixed(2)}</h3>
                </div>
            </div>

            {/* BUSCADOR Y FILTROS */}
            <div className="os-filter-bar" style={{ marginBottom: '16px' }}>
                <div className="filter-search">
                    <span className="material-symbols-outlined">search</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por código, nombre o marca..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="Todos">Todas las Categorías</option>
                    <option value="Frenos">Frenos</option>
                    <option value="Motor">Motor</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                </select>
            </div>

            {/* TABLA PRINCIPAL */}
            <div className="os-table-wrapper">
                <table className="os-table">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Código</th>
                            <th>Nombre de Ítem</th>
                            <th>Unidad</th>
                            <th>Categoría</th>
                            <th>Marca</th>
                            <th>Stock</th>
                            <th>Costo</th>
                            <th>Precio (Inc. 18% IGV)</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosFiltrados.map(p => (
                            <tr key={p.id}>
                                <td><span className={`proc-tag ${p.tipo.toLowerCase()}`}>{p.tipo}</span></td>
                                <td><strong>{p.codigo}</strong></td>
                                <td>{p.nombre}</td>
                                <td>{p.unidad}</td>
                                <td>{p.categoria}</td>
                                <td>{p.marca}</td>
                                <td>
                                    <span style={{ color: p.stock <= p.minimo ? '#ef4444' : '#1e293b', fontWeight: 'bold' }}>
                                        {p.stock}
                                    </span>
                                </td>
                                <td>S/ {p.costo ? p.costo.toFixed(2) : "0.00"}</td>
                                <td><strong>S/ {p.precio.toFixed(2)}</strong></td>
                                <td>
                                    <div className="table-actions">
                                        <button className="btn-act-table link">✏️ Editar</button>
                                        <button className="btn-act-table btn-reject" style={{ background: '#fee2e2', color: '#b91c1c' }}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL NUEVO ÍTEM */}
            {mostrarFormulario && (
                <div className="modal-overlay">
                    <div className="modal-content inv-modal" style={{ maxWidth: '650px' }}>
                        <div className="modal-header">
                            <div>
                                <h2>Nuevo Ítem de Inventario</h2>
                                <p>Registro normalizado con impuestos (18% IGV)</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarFormulario(false)}>✕</button>
                        </div>

                        <form onSubmit={agregarProducto}>
                            <div className="modal-body">
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <label className="inv-label" style={{ margin: 0 }}>Tipo de Ítem *</label>
                                    <button 
                                        type="button" 
                                        className="btn-help-nomenclatura"
                                        onClick={() => setMostrarAyudaNomenclatura(true)}
                                    >
                                        ❓ Reglas de Nomenclatura Estricta
                                    </button>
                                </div>

                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                    <div className="inv-field">
                                        <label className="inv-label">Tipo</label>
                                        <select className="inv-select" name="tipo" value={nuevoProducto.tipo} onChange={handleInputChange}>
                                            <option value="Producto">Producto (Repuesto/Insumo)</option>
                                            <option value="Servicio">Servicio (Mano de Obra)</option>
                                            <option value="Compuestos">Compuestos (Kit Combo)</option>
                                        </select>
                                    </div>

                                    <div className="inv-field">
                                        <label className="inv-label">Unidad de Medida</label>
                                        <select className="inv-select" name="unidad" value={nuevoProducto.unidad} onChange={handleInputChange}>
                                            <option value="Pieza">Pieza (PZA)</option>
                                            <option value="Hora Hombre">Hora Hombre (HH)</option>
                                            <option value="Juego">Juego (JGO)</option>
                                            <option value="Kit">Kit (KIT)</option>
                                            <option value="Litro">Litro (LTR)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                    <div className="inv-field">
                                        <label className="inv-label">Código Referencia *</label>
                                        <input className="inv-input" type="text" name="codigo" placeholder="Ej: BRK-892-C" value={nuevoProducto.codigo} onChange={handleInputChange} required />
                                    </div>

                                    <div className="inv-field">
                                        <label className="inv-label">Categoría</label>
                                        <select className="inv-select" name="categoria" value={nuevoProducto.categoria} onChange={handleInputChange}>
                                            <option value="Motor">Motor</option>
                                            <option value="Frenos">Frenos</option>
                                            <option value="Suspensión">Suspensión</option>
                                            <option value="Servicios">Servicios</option>
                                            <option value="Mantenimiento">Mantenimiento</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="inv-field" style={{ marginBottom: '14px' }}>
                                    <label className="inv-label">Nombre según Nomenclatura *</label>
                                    <input className="inv-input" type="text" name="nombre" placeholder="Ej: Pastillas de Freno Delanteras Brembo Toyota Corolla" value={nuevoProducto.nombre} onChange={handleInputChange} required />
                                </div>

                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                    <div className="inv-field">
                                        <label className="inv-label">Marca</label>
                                        <input className="inv-input" type="text" name="marca" placeholder="Ej: Brembo" value={nuevoProducto.marca} onChange={handleInputChange} />
                                    </div>
                                    <div className="inv-field">
                                        <label className="inv-label">Stock Inicial</label>
                                        <input className="inv-input" type="number" name="stock" placeholder="10" value={nuevoProducto.stock} onChange={handleInputChange} />
                                    </div>
                                    <div className="inv-field">
                                        <label className="inv-label">Stock Mínimo Alerta</label>
                                        <input className="inv-input" type="number" name="minimo" placeholder="5" value={nuevoProducto.minimo} onChange={handleInputChange} />
                                    </div>
                                </div>

                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                                    <div className="inv-field">
                                        <label className="inv-label">Costo Compra (S/)</label>
                                        <input className="inv-input" type="number" name="costo" placeholder="50.00" value={nuevoProducto.costo} onChange={handleInputChange} step="0.01" />
                                    </div>
                                    <div className="inv-field">
                                        <label className="inv-label">Precio Venta (S/) *</label>
                                        <input className="inv-input" type="number" name="precio" placeholder="85.00" value={nuevoProducto.precio} onChange={handleInputChange} step="0.01" required />
                                    </div>
                                    <div className="inv-field">
                                        <label className="inv-label">Impuestos</label>
                                        <input className="inv-input readonly" type="text" value="18% IGV Incluido" readOnly />
                                    </div>
                                </div>

                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
                                <button type="submit" className="btn-guardar">Registrar Ítem</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL REGLAS DE NOMENCLATURA ESTRICTA */}
            {mostrarAyudaNomenclatura && (
                <div className="modal-overlay">
                    <div className="modal-content inv-modal" style={{ maxWidth: '550px' }}>
                        <div className="modal-header warning-header">
                            <h2>📌 Reglas Estrictas de Nomenclatura</h2>
                            <button className="btn-close" onClick={() => setMostrarAyudaNomenclatura(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                            <p><strong>Formato Obligatorio para Ítems en VeraMotors:</strong></p>
                            <code className="nomenclatura-code">
                                [CATEGORÍA]-[SUBCOMPONENTE]-[MARCA/REFERENCIA]
                            </code>
                            <ul className="nomenclatura-list">
                                <li><strong>Productos:</strong> Especificar Nombre del Componente + Posición (Delantero/Trasero) + Marca + Compatibilidad Vehicular.</li>
                                <li><strong>Servicios:</strong> Iniciar siempre con "Servicio de..." seguido del sistema intervenido (Ej: Servicio de Rectificación de Discos).</li>
                                <li><strong>Compuestos:</strong> Iniciar con "Kit de..." especificando el contenido principal.</li>
                            </ul>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-guardar" onClick={() => setMostrarAyudaNomenclatura(false)}>Entendido</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Inventario;