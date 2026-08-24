import { useState } from "react";
import "./Configuracion.css";

const SUBMENUS_CONFIG = [
    "Parámetros del Taller",
    "Usuarios y Perfiles",
    "Integraciones & Notificaciones",
    "Series y Comprobantes"
];

function Configuracion() {
    const [subtab, setSubtab] = useState("Parámetros del Taller");

    // Parámetros de la Empresa
    const [empresaData, setEmpresaData] = useState({
        nombre: "VERAMOTORS S.A.C.",
        desarrollador: "RAZOR S.A.C.",
        ruc: "20601234567",
        direccion: "Av. La Marina 2840, San Miguel, Lima",
        telefono: "+51 1 458-9200",
        email: "contacto@veramotors.pe",
        igv: "18",
        moneda: "PEN - Soles (S/)"
    });

    // Usuarios del Sistema
    const [usuarios, setUsuarios] = useState([
        { id: 1, nombre: "Jorge Carrión", email: "admin@veramotors.pe", rol: "Administrador", estado: "Activo" },
        { id: 2, nombre: "Carlos Mendoza", email: "asesor.servicio@veramotors.pe", rol: "Asesor de Servicio", estado: "Activo" },
        { id: 3, nombre: "Elena Rojas", email: "repuestos@veramotors.pe", rol: "Asesor de Repuestos", estado: "Activo" },
        { id: 4, nombre: "Luis García", email: "tecnico.garcia@veramotors.pe", rol: "Técnico Automotriz", estado: "Activo" },
        { id: 5, nombre: "Pedro Ramírez", email: "tecnico.ramirez@veramotors.pe", rol: "Técnico Automotriz", estado: "Activo" }
    ]);

    // Modal Nuevo Usuario
    const [mostrarModalUsuario, setMostrarModalUsuario] = useState(false);
    const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", email: "", rol: "Asesor de Servicio" });

    // Series
    const [series, setSeries] = useState({
        factura: "F001",
        boleta: "B001",
        cotizacion: "COT-",
        ods: "ODS-"
    });

    const guardarEmpresa = (e) => {
        e.preventDefault();
        alert("¡Parámetros del taller actualizados correctamente!");
    };

    const toggleEstadoUsuario = (id) => {
        const actualizados = usuarios.map(u => u.id === id ? { ...u, estado: u.estado === "Activo" ? "Inactivo" : "Activo" } : u);
        setUsuarios(actualizados);
    };

    const agregarUsuario = (e) => {
        e.preventDefault();
        if (!nuevoUsuario.nombre || !nuevoUsuario.email) {
            alert("Completa el nombre y correo del usuario.");
            return;
        }
        const u = {
            id: Date.now(),
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol,
            estado: "Activo"
        };
        setUsuarios([...usuarios, u]);
        setMostrarModalUsuario(false);
        setNuevoUsuario({ nombre: "", email: "", rol: "Asesor de Servicio" });
        alert(`¡Usuario ${u.nombre} creado con éxito para el rol ${u.rol}!`);
    };

    return (
        <div className="config-page">

            {/* CABECERA */}
            <div className="config-header">
                <h2>Configuración y Parámetros del Sistema</h2>
                <p>Configuración institucional de VERAMOTORS SAC, usuarios, perfiles de acceso y notificaciones.</p>
            </div>

            {/* PESTAÑAS HORIZONTALES */}
            <div className="config-tabs">
                {SUBMENUS_CONFIG.map(tab => (
                    <button
                        key={tab}
                        className={`config-tab-btn ${subtab === tab ? "active" : ""}`}
                        onClick={() => setSubtab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* 1. PARÁMETROS DEL TALLER */}
            {subtab === "Parámetros del Taller" && (
                <div className="config-card">
                    <h3>🏛️ Información Institucional del Taller</h3>
                    <form onSubmit={guardarEmpresa}>
                        <div className="config-form-grid" style={{ marginBottom: '16px' }}>
                            <div className="config-field">
                                <label>Nombre de la Empresa (App Responsive)</label>
                                <input type="text" value={empresaData.nombre} onChange={(e) => setEmpresaData({ ...empresaData, nombre: e.target.value })} required />
                            </div>

                            <div className="config-field">
                                <label>Empresa Desarrolladora</label>
                                <input type="text" value={empresaData.desarrollador} onChange={(e) => setEmpresaData({ ...empresaData, desarrollador: e.target.value })} required />
                            </div>

                            <div className="config-field">
                                <label>RUC Institucional</label>
                                <input type="text" value={empresaData.ruc} onChange={(e) => setEmpresaData({ ...empresaData, ruc: e.target.value })} required />
                            </div>

                            <div className="config-field">
                                <label>Impuesto General a las Ventas (IGV)</label>
                                <input type="text" value={`${empresaData.igv}%`} disabled style={{ background: '#f1f5f9' }} />
                            </div>
                        </div>

                        <div className="config-form-grid" style={{ marginBottom: '20px' }}>
                            <div className="config-field">
                                <label>Dirección del Taller Principal</label>
                                <input type="text" value={empresaData.direccion} onChange={(e) => setEmpresaData({ ...empresaData, direccion: e.target.value })} />
                            </div>

                            <div className="config-field">
                                <label>Teléfono Central</label>
                                <input type="text" value={empresaData.telefono} onChange={(e) => setEmpresaData({ ...empresaData, telefono: e.target.value })} />
                            </div>

                            <div className="config-field">
                                <label>Correo Institucional</label>
                                <input type="email" value={empresaData.email} onChange={(e) => setEmpresaData({ ...empresaData, email: e.target.value })} />
                            </div>

                            <div className="config-field">
                                <label>Moneda del Sistema</label>
                                <input type="text" value={empresaData.moneda} disabled style={{ background: '#f1f5f9' }} />
                            </div>
                        </div>

                        <button type="submit" className="btn-act-table link" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                            💾 Guardar Cambios
                        </button>
                    </form>
                </div>
            )}

            {/* 2. USUARIOS Y PERFILES */}
            {subtab === "Usuarios y Perfiles" && (
                <div className="config-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, border: 'none' }}>👥 Usuarios y Control de Roles</h3>
                        <button className="btn-act-table link" style={{ padding: '8px 16px' }} onClick={() => setMostrarModalUsuario(true)}>
                            + Crear Nuevo Usuario
                        </button>
                    </div>

                    <div className="os-table-wrapper">
                        <table className="os-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre del Usuario</th>
                                    <th>Correo Electrónico</th>
                                    <th>Rol Asignado</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map(u => (
                                    <tr key={u.id}>
                                        <td><strong>#{u.id}</strong></td>
                                        <td>{u.nombre}</td>
                                        <td>{u.email}</td>
                                        <td><span className="proc-tag preventivo">{u.rol}</span></td>
                                        <td>
                                            <span style={{ color: u.estado === "Activo" ? '#16a34a' : '#ef4444', fontWeight: 'bold' }}>
                                                {u.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-act-table diag" onClick={() => toggleEstadoUsuario(u.id)}>
                                                {u.estado === "Activo" ? "Desactivar" : "Activar"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 3. INTEGRACIONES & NOTIFICACIONES */}
            {subtab === "Integraciones & Notificaciones" && (
                <div className="config-card">
                    <h3>📲 Integraciones de Comunicación (WhatsApp & Email)</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                            <h4>🟢 WhatsApp Business API</h4>
                            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Envío automático de citaciones, ODS para aprobación del cliente y notificaciones de entrega.</p>

                            <div className="config-field" style={{ marginTop: '12px' }}>
                                <label>API Key / Token de WhatsApp</label>
                                <input type="password" value="wh_live_9928374829104857392" readOnly style={{ background: '#e2e8f0' }} />
                            </div>

                            <button className="btn-act-table link" style={{ marginTop: '12px' }} onClick={() => alert("Prueba de conexión con WhatsApp API: Operativa 100%.")}>
                                ⚡ Probar Conexión WhatsApp
                            </button>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                            <h4>✉️ Servidor de Correo SMTP</h4>
                            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Notificaciones de ODS, cotizaciones y facturas electrónicas vía e-mail.</p>

                            <div className="config-field" style={{ marginTop: '12px' }}>
                                <label>Host SMTP</label>
                                <input type="text" value="smtp.veramotors.pe:587" readOnly style={{ background: '#e2e8f0' }} />
                            </div>

                            <button className="btn-act-table link" style={{ marginTop: '12px' }} onClick={() => alert("Correo de prueba enviado con éxito.")}>
                                📧 Enviar Correo de Prueba
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. SERIES Y COMPROBANTES */}
            {subtab === "Series y Comprobantes" && (
                <div className="config-card">
                    <h3>🧾 Configuración de Series y Correlativos SUNAT / ODS</h3>

                    <div className="config-form-grid" style={{ marginBottom: '20px' }}>
                        <div className="config-field">
                            <label>Serie de Factura Electrónica</label>
                            <input type="text" value={series.factura} onChange={(e) => setSeries({ ...series, factura: e.target.value })} />
                        </div>

                        <div className="config-field">
                            <label>Serie de Boleta Electrónica</label>
                            <input type="text" value={series.boleta} onChange={(e) => setSeries({ ...series, boleta: e.target.value })} />
                        </div>

                        <div className="config-field">
                            <label>Prefijo de Cotizaciones</label>
                            <input type="text" value={series.cotizacion} onChange={(e) => setSeries({ ...series, cotizacion: e.target.value })} />
                        </div>

                        <div className="config-field">
                            <label>Prefijo Orden de Servicio (ODS)</label>
                            <input type="text" value={series.ods} onChange={(e) => setSeries({ ...series, ods: e.target.value })} />
                        </div>
                    </div>

                    <button className="btn-act-table link" style={{ padding: '10px 20px', fontSize: '0.9rem' }} onClick={() => alert("Correlativos y series actualizadas.")}>
                        💾 Guardar Correlativos
                    </button>
                </div>
            )}

            {/* MODAL CREAR USUARIO */}
            {mostrarModalUsuario && (
                <div className="modal-overlay">
                    <div className="modal-content config-modal" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <div>
                                <h2>Crear Nuevo Usuario del Sistema</h2>
                                <p>Asigna credenciales y rol de usuario en VeraMotors.</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModalUsuario(false)}>✕</button>
                        </div>

                        <form onSubmit={agregarUsuario}>
                            <div className="modal-body">
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Nombre Completo *</label>
                                    <input type="text" value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })} required />
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Correo Electrónico *</label>
                                    <input type="email" value={nuevoUsuario.email} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })} required />
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Rol del Sistema *</label>
                                    <select value={nuevoUsuario.rol} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}>
                                        <option value="Administrador">Administrador</option>
                                        <option value="Asesor de Servicio">Asesor de Servicio</option>
                                        <option value="Asesor de Repuestos">Asesor de Repuestos</option>
                                        <option value="Técnico Automotriz">Técnico Automotriz</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setMostrarModalUsuario(false)}>Cancelar</button>
                                <button type="submit" className="btn-guardar">Crear Usuario</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Configuracion;