import { useState } from "react";
import { useRole } from "../../context/RoleContext";
import "./Header.css";

function Header() {
    const { rolActivo, notificaciones } = useRole();
    const [mostrarNotif, setMostrarNotif] = useState(false);

    const notifFiltradas = notificaciones.filter(n => !n.paraRol || n.paraRol === rolActivo);

    return (
        <header className="header">

            <div className="header-left">
                <div>
                    <h1>VERAMOTORS SAC</h1>
                    <p>Sistema Integral de Administración de Taller Automotriz</p>
                </div>
            </div>

            <div className="header-right">

                <div className="notification-wrapper" style={{ position: "relative" }}>
                    <button 
                        className="notification-button"
                        onClick={() => setMostrarNotif(!mostrarNotif)}
                        title="Notificaciones del sistema"
                    >
                        🔔
                        {notifFiltradas.length > 0 && (
                            <span className="notification-badge">{notifFiltradas.length}</span>
                        )}
                    </button>

                    {mostrarNotif && (
                        <div className="notification-dropdown" style={{
                            position: 'absolute',
                            right: 0,
                            top: '45px',
                            width: '320px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                            zIndex: 100,
                            padding: '12px'
                        }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', borderBottom: '1px solid #334155', paddingBottom: '6px', color: '#f8fafc' }}>
                                Notificaciones ({rolActivo})
                            </h4>
                            {notifFiltradas.length === 0 ? (
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '8px 0' }}>Sin nuevas alertas.</p>
                            ) : (
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {notifFiltradas.map(n => (
                                        <div key={n.id} style={{ padding: '8px', borderBottom: '1px solid #334155', fontSize: '0.8rem', color: '#cbd5e1' }}>
                                            <p style={{ margin: 0 }}>{n.mensaje}</p>
                                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{n.tiempo}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="header-user">
                    <div className="header-avatar">
                        {rolActivo.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="header-user-info">
                        <strong>{rolActivo}</strong>
                        <span>RAZOR SAC</span>
                    </div>
                </div>

            </div>

        </header>
    );
}

export default Header;