import { useState, useEffect } from "react";
import "./Proveedores.css";
import { obtenerProveedores, crearProveedor } from "../../services/proveedoresService";

function Proveedores() {
    const [busqueda, setBusqueda] = useState("");
    const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [cargando, setCargando] = useState(false);

    const [proveedores, setProveedores] = useState([]);

    const cargarProveedores = async () => {
        try {
            setCargando(true);
            const data = await obtenerProveedores();
            setProveedores(data);
        } catch (error) {
            console.error("Error cargando proveedores:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarProveedores();
    }, []);

    const [nuevoProv, setNuevoProv] = useState({
        ruc: "",
        razon_social: "",
        contacto: "",
        telefono: "",
        email: "",
        direccion: "",
        activo: true
    });

    const proveedoresFiltrados = proveedores.filter(p => {
        const coincideBusqueda = p.razon_social.toLowerCase().includes(busqueda.toLowerCase()) || p.ruc.includes(busqueda);
        return coincideBusqueda;
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNuevoProv({ ...nuevoProv, [name]: value });
    };

    const guardarProveedor = async (e) => {
        e.preventDefault();
        if (!nuevoProv.ruc || !nuevoProv.razon_social || !nuevoProv.telefono) {
            alert("Completa los campos obligatorios (RUC, Razón Social y Teléfono).");
            return;
        }

        try {
            await crearProveedor(nuevoProv);
            setMostrarModal(false);
            setNuevoProv({ ruc: "", razon_social: "", contacto: "", telefono: "", email: "", direccion: "", activo: true });
            cargarProveedores();
            alert("¡Proveedor registrado exitosamente en el sistema!");
        } catch (error) {
            console.error("Error registrando proveedor:", error);
            alert("Error al registrar el proveedor");
        }
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
            </div>

            {/* TABLA DE PROVEEDORES */}
            <div className="os-table-wrapper">
                <table className="os-table">
                    <thead>
                        <tr>
                            <th>RUC</th>
                            <th>Razón Social</th>
                            <th>Contacto Principal</th>
                            <th>Teléfono</th>
                            <th>Correo Electrónico</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proveedoresFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                                    No se encontraron proveedores que coincidan con la búsqueda.
                                </td>
                            </tr>
                        ) : (
                            proveedoresFiltrados.map(p => (
                                <tr key={p.proveedor_id}>
                                    <td><strong>{p.ruc}</strong></td>
                                    <td>{p.razon_social}</td>
                                    <td>{p.contacto || "N/A"}</td>
                                    <td>{p.telefono || "N/A"}</td>
                                    <td>{p.email || "N/A"}</td>
                                    <td><span className={`proc-tag ${p.activo ? "preventivo" : "correctivo"}`}>{p.activo ? "Activo" : "Inactivo"}</span></td>
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
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>RUC (11 Dígitos) *</label>
                                    <input type="text" name="ruc" placeholder="20601234567" value={nuevoProv.ruc} onChange={handleInputChange} required />
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Razón Social *</label>
                                    <input type="text" name="razon_social" placeholder="Nombre completo o empresa..." value={nuevoProv.razon_social} onChange={handleInputChange} required />
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