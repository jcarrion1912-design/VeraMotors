import { useState } from "react";
import "./Proveedores.css";

function Proveedores() {
    const [busqueda, setBusqueda] = useState("");
    const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
    const [mostrarModal, setMostrarModal] = useState(false);

    const [proveedores, setProveedores] = useState([
        { id: 1, ruc: "20549812341", razonSocial: "Brembo Perú S.A.C.", contacto: "Roberto Silva", telefono: "+51 987 111 222", email: "ventas@brembo.pe", direccion: "Av. Argentina 1840, Callao", categoria: "Frenos", calificacion: "5 ⭐" },
        { id: 2, ruc: "20601239841", razonSocial: "Distribuidora de Lubricantes Mobil1", contacto: "Mariana Torres", telefono: "+51 912 444 555", email: "pedidos@mobil.pe", direccion: "Av. Nicolás Arriola 450, La Victoria", categoria: "Lubricantería", calificacion: "4.8 ⭐" },
        { id: 3, ruc: "20492817263", razonSocial: "Bosch Autopartes del Perú", contacto: "Carlos Mendoza Jr.", telefono: "+51 945 777 888", email: "contacto@bosch.pe", direccion: "Av. Industrial 290, Ate", categoria: "Motor & Electricidad", calificacion: "4.9 ⭐" },
        { id: 4, ruc: "20109283741", razonSocial: "NGK Spark Plugs Perú", contacto: "Ana Paula Rios", telefono: "+51 933 222 111", email: "ventas@ngk.pe", direccion: "Av. Separadora Industrial 500, Ate", categoria: "Motor", calificacion: "4.7 ⭐" },
    ]);

    const [nuevoProv, setNuevoProv] = useState({
        ruc: "",
        razonSocial: "",
        contacto: "",
        telefono: "",
        email: "",
        direccion: "",
        categoria: "Frenos"
    });

    const proveedoresFiltrados = proveedores.filter(p => {
        const coincideBusqueda = p.razonSocial.toLowerCase().includes(busqueda.toLowerCase()) || p.ruc.includes(busqueda);
        const coincideCat = categoriaFiltro === "Todas" || p.categoria === categoriaFiltro;
        return coincideBusqueda && coincideCat;
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNuevoProv({ ...nuevoProv, [name]: value });
    };

    const guardarProveedor = (e) => {
        e.preventDefault();
        if (!nuevoProv.ruc || !nuevoProv.razonSocial || !nuevoProv.telefono) {
            alert("Completa los campos obligatorios (RUC, Razón Social y Teléfono).");
            return;
        }

        const nuevo = {
            id: Date.now(),
            ruc: nuevoProv.ruc,
            razonSocial: nuevoProv.razonSocial,
            contacto: nuevoProv.contacto || "Sin Contacto",
            telefono: nuevoProv.telefono,
            email: nuevoProv.email || "N/A",
            direccion: nuevoProv.direccion || "N/A",
            categoria: nuevoProv.categoria,
            calificacion: "5.0 ⭐"
        };

        setProveedores([...proveedores, nuevo]);
        setMostrarModal(false);
        setNuevoProv({ ruc: "", razonSocial: "", contacto: "", telefono: "", email: "", direccion: "", categoria: "Frenos" });
        alert("¡Proveedor registrado exitosamente en el sistema!");
    };

    return (
        <div className="proveedores-page">

            {/* CABECERA */}
            <div className="proveedores-header">
                <div>
                    <h2>Directorio de Proveedores</h2>
                    <p>Gestión de proveedores homologados de insumos y repuestos de VeraMotors SAC.</p>
                </div>

                <button className="btn-nuevo-proveedor" onClick={() => setMostrarModal(true)}>
                    <span className="material-symbols-outlined">person_add</span>
                    + Nuevo Proveedor
                </button>
            </div>

            {/* BARRA DE BÚSQUEDA Y FILTROS */}
            <div className="os-filter-bar" style={{ marginBottom: '20px' }}>
                <div className="filter-search">
                    <span className="material-symbols-outlined">search</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por RUC o Razón Social..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="Todas">Todas las Categorías</option>
                    <option value="Frenos">Frenos</option>
                    <option value="Lubricantería">Lubricantería</option>
                    <option value="Motor">Motor</option>
                    <option value="Motor & Electricidad">Motor & Electricidad</option>
                </select>
            </div>

            {/* TABLA DE PROVEEDORES */}
            <div className="os-table-wrapper">
                <table className="os-table">
                    <thead>
                        <tr>
                            <th>RUC</th>
                            <th>Razón Social</th>
                            <th>Categoría / Rubro</th>
                            <th>Contacto Principal</th>
                            <th>Teléfono</th>
                            <th>Correo Electrónico</th>
                            <th>Calificación</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proveedoresFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                                    No se encontraron proveedores que coincidan con la búsqueda.
                                </td>
                            </tr>
                        ) : (
                            proveedoresFiltrados.map(p => (
                                <tr key={p.id}>
                                    <td><strong>{p.ruc}</strong></td>
                                    <td>{p.razonSocial}</td>
                                    <td><span className="proc-tag preventivo">{p.categoria}</span></td>
                                    <td>{p.contacto}</td>
                                    <td>{p.telefono}</td>
                                    <td>{p.email}</td>
                                    <td><strong>{p.calificacion}</strong></td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-act-table link">✏️ Editar</button>
                                            <button className="btn-act-table diag">📞 Contactar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL NUEVO PROVEEDOR */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content prov-modal" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <div>
                                <h2>Nuevo Proveedor Homologado</h2>
                                <p>Ingresa los datos fiscales y de contacto comercial.</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModal(false)}>✕</button>
                        </div>

                        <form onSubmit={guardarProveedor}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>RUC (11 Dígitos) *</label>
                                        <input type="text" name="ruc" placeholder="20601234567" value={nuevoProv.ruc} onChange={handleInputChange} required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Categoría / Rubro *</label>
                                        <select name="categoria" value={nuevoProv.categoria} onChange={handleInputChange}>
                                            <option value="Frenos">Frenos</option>
                                            <option value="Lubricantería">Lubricantería</option>
                                            <option value="Motor">Motor</option>
                                            <option value="Electricidad">Electricidad</option>
                                            <option value="Herramientas & Equipos">Herramientas & Equipos</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Razón Social *</label>
                                    <input type="text" name="razonSocial" placeholder="Nombre completo o empresa..." value={nuevoProv.razonSocial} onChange={handleInputChange} required />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Contacto Principal</label>
                                        <input type="text" name="contacto" placeholder="Nombre del asesor comercial..." value={nuevoProv.contacto} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Teléfono / Celular *</label>
                                        <input type="tel" name="telefono" placeholder="+51 987..." value={nuevoProv.telefono} onChange={handleInputChange} required />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Correo Electrónico</label>
                                        <input type="email" name="email" placeholder="ventas@proveedor.pe" value={nuevoProv.email} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Dirección Fiscal</label>
                                        <input type="text" name="direccion" placeholder="Av. Principal 123..." value={nuevoProv.direccion} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setMostrarModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-guardar">Registrar Proveedor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Proveedores;