import { useState, useEffect } from "react";
import "./Proveedores.css";
import { obtenerProveedores, crearProveedor, actualizarProveedor } from "../../services/proveedoresService";

const PROVEEDOR_VACIO = { ruc: "", razon_social: "", contacto: "", telefono: "", email: "", direccion: "", activo: true };

const enlaceWhatsapp = (telefono) => {
    const digitos = String(telefono || "").replace(/\D/g, "");
    if (!digitos) return null;
    return `https://wa.me/${digitos.length === 9 ? `51${digitos}` : digitos}`;
};

function Proveedores() {
    const [busqueda, setBusqueda] = useState("");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [proveedorEditandoId, setProveedorEditandoId] = useState(null);
    const [proveedorContacto, setProveedorContacto] = useState(null);

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

    const [nuevoProv, setNuevoProv] = useState(PROVEEDOR_VACIO);

    const abrirNuevo = () => {
        setProveedorEditandoId(null);
        setNuevoProv(PROVEEDOR_VACIO);
        setMostrarModal(true);
    };

    const abrirEdicion = (p) => {
        setProveedorEditandoId(p.proveedor_id);
        setNuevoProv({
            ruc: p.ruc || "",
            razon_social: p.razon_social || "",
            contacto: p.contacto || "",
            telefono: p.telefono || "",
            email: p.email || "",
            direccion: p.direccion || "",
            activo: p.activo
        });
        setMostrarModal(true);
    };

    const cerrarModal = () => {
        setMostrarModal(false);
        setProveedorEditandoId(null);
    };

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
            if (proveedorEditandoId) {
                await actualizarProveedor(proveedorEditandoId, nuevoProv);
            } else {
                await crearProveedor(nuevoProv);
            }
            const mensaje = proveedorEditandoId
                ? "Proveedor actualizado correctamente."
                : "¡Proveedor registrado exitosamente en el sistema!";
            cerrarModal();
            setNuevoProv(PROVEEDOR_VACIO);
            cargarProveedores();
            alert(mensaje);
        } catch (error) {
            console.error("Error guardando proveedor:", error);
            alert(error.message || "Error al guardar el proveedor");
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

                <button className="btn-nuevo-proveedor" onClick={abrirNuevo}>
                    <span className="material-symbols-outlined">add_business</span>
                    Nuevo Proveedor
                </button>
            </div>

            {cargando && <p className="vm-loading" role="status">Consultando proveedores…</p>}

            {/* BARRA DE BÚSQUEDA Y FILTROS */}
            <div className="os-filter-bar">
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
                                <td colSpan="7">
                                    <div className="vm-empty">
                                        <span className="material-symbols-outlined">storefront</span>
                                        <strong>Sin resultados</strong>
                                        <span>No se encontraron proveedores que coincidan con la búsqueda.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            proveedoresFiltrados.map(p => (
                                <tr key={p.proveedor_id}>
                                    <td><span className="vm-code">{p.ruc}</span></td>
                                    <td><strong>{p.razon_social}</strong></td>
                                    <td>{p.contacto || "N/A"}</td>
                                    <td>{p.telefono || "N/A"}</td>
                                    <td>{p.email || "N/A"}</td>
                                    <td><span className={`vm-badge ${p.activo ? "vm-badge-success" : "vm-badge-danger"}`}>{p.activo ? "Activo" : "Inactivo"}</span></td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-act-table link" onClick={() => abrirEdicion(p)}>
                                                <span className="material-symbols-outlined">edit</span>
                                                Editar
                                            </button>
                                            <button className="btn-act-table" onClick={() => setProveedorContacto(p)}>
                                                <span className="material-symbols-outlined">call</span>
                                                Contactar
                                            </button>
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
                    <div className="modal-content prov-modal">
                        <div className="modal-header">
                            <div>
                                <h2>{proveedorEditandoId ? "Editar Proveedor" : "Nuevo Proveedor Homologado"}</h2>
                                <p>Ingresa los datos fiscales y de contacto comercial.</p>
                            </div>
                            <button className="btn-close" aria-label="Cerrar" onClick={cerrarModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={guardarProveedor}>
                            <div className="modal-body">
                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">badge</span>
                                    Datos fiscales
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>RUC (11 Dígitos) *</label>
                                        <input type="text" name="ruc" placeholder="20601234567" value={nuevoProv.ruc} onChange={handleInputChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Razón Social *</label>
                                        <input type="text" name="razon_social" placeholder="Nombre completo o empresa..." value={nuevoProv.razon_social} onChange={handleInputChange} required />
                                    </div>
                                </div>

                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">contact_phone</span>
                                    Contacto y ubicación
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Contacto Principal</label>
                                        <input type="text" name="contacto" placeholder="Nombre del asesor comercial..." value={nuevoProv.contacto} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Teléfono / Celular *</label>
                                        <input type="tel" name="telefono" placeholder="+51 987..." value={nuevoProv.telefono} onChange={handleInputChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Correo Electrónico</label>
                                        <input type="email" name="email" placeholder="ventas@proveedor.pe" value={nuevoProv.email} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Dirección Fiscal</label>
                                        <input type="text" name="direccion" placeholder="Av. Principal 123..." value={nuevoProv.direccion} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancelar" onClick={cerrarModal}>Cancelar</button>
                                <button type="submit" className="btn-guardar">{proveedorEditandoId ? "Guardar Cambios" : "Registrar Proveedor"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CONTACTAR */}
            {proveedorContacto && (
                <div className="modal-overlay">
                    <div className="modal-content prov-modal">
                        <div className="modal-header">
                            <div>
                                <h2>Contactar Proveedor</h2>
                                <p>{proveedorContacto.razon_social}{proveedorContacto.contacto ? ` · ${proveedorContacto.contacto}` : ""}</p>
                            </div>
                            <button className="btn-close" aria-label="Cerrar" onClick={() => setProveedorContacto(null)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body prov-contacto">
                            {proveedorContacto.telefono ? (
                                <>
                                    <a className="vm-btn vm-btn-secondary" href={`tel:${proveedorContacto.telefono}`}>
                                        <span className="material-symbols-outlined">call</span>
                                        Llamar a {proveedorContacto.telefono}
                                    </a>
                                    <a className="vm-btn vm-btn-secondary" href={enlaceWhatsapp(proveedorContacto.telefono)} target="_blank" rel="noopener noreferrer">
                                        <span className="material-symbols-outlined">chat</span>
                                        Escribir por WhatsApp
                                    </a>
                                </>
                            ) : (
                                <p>Este proveedor no tiene teléfono registrado.</p>
                            )}
                            {proveedorContacto.email ? (
                                <a className="vm-btn vm-btn-secondary" href={`mailto:${proveedorContacto.email}`}>
                                    <span className="material-symbols-outlined">mail</span>
                                    Enviar correo a {proveedorContacto.email}
                                </a>
                            ) : (
                                <p>Este proveedor no tiene correo registrado.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Proveedores;