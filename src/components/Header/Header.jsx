import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../../context/RoleContext";
import "./Header.css";

function Header() {
    const navigate = useNavigate();

    const { notificaciones } = useRole();

    const [mostrarNotif, setMostrarNotif] = useState(false);
    const [mostrarMenuUsuario, setMostrarMenuUsuario] = useState(false);

    // ==========================================
    // USUARIO AUTENTICADO
    // ==========================================

    const usuarioGuardado = localStorage.getItem("usuario");

    let usuario = null;

    try {
        usuario = usuarioGuardado
            ? JSON.parse(usuarioGuardado)
            : null;
    } catch (error) {
        console.error("Error leyendo usuario:", error);
        usuario = null;
    }

    const rolActivo = usuario?.rol || "Usuario";
    const nombreUsuario = usuario?.nombre || "Usuario";


    // ==========================================
    // NOTIFICACIONES
    // ==========================================

    const notifFiltradas = notificaciones.filter(
        n => !n.paraRol || n.paraRol === rolActivo
    );


    // ==========================================
    // CERRAR SESIÓN
    // ==========================================

    const cerrarSesion = () => {

        // Eliminar información de sesión
        localStorage.removeItem("usuario");
        localStorage.removeItem("loginTime");

        // Cerrar menús
        setMostrarNotif(false);
        setMostrarMenuUsuario(false);

        // Ir al Login
        navigate("/login", {
            replace: true
        });
    };


    return (
        <header className="header">

            {/* ==========================================
                HEADER LEFT
            ========================================== */}

            <div className="header-left">

                <div>

                    <h1>
                        VERAMOTORS SAC
                    </h1>

                    <p>
                        Sistema Integral de Administración de Taller Automotriz
                    </p>

                </div>

            </div>


            {/* ==========================================
                HEADER RIGHT
            ========================================== */}

            <div className="header-right">


                {/* ==========================================
                    NOTIFICACIONES
                ========================================== */}

                <div
                    className="notification-wrapper"
                    style={{
                        position: "relative"
                    }}
                >

                    <button
                        className="notification-button"
                        onClick={() =>
                            setMostrarNotif(!mostrarNotif)
                        }
                        title="Notificaciones del sistema"
                    >

                        🔔

                        {notifFiltradas.length > 0 && (
                            <span className="notification-badge">
                                {notifFiltradas.length}
                            </span>
                        )}

                    </button>


                    {mostrarNotif && (

                        <div
                            className="notification-dropdown"
                            style={{
                                position: "absolute",
                                right: 0,
                                top: "45px",
                                width: "320px",
                                background: "#1e293b",
                                border: "1px solid #334155",
                                borderRadius: "8px",
                                boxShadow:
                                    "0 10px 25px rgba(0,0,0,0.5)",
                                zIndex: 100,
                                padding: "12px"
                            }}
                        >

                            <h4
                                style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "0.9rem",
                                    borderBottom:
                                        "1px solid #334155",
                                    paddingBottom: "6px",
                                    color: "#f8fafc"
                                }}
                            >
                                Notificaciones ({rolActivo})
                            </h4>


                            {notifFiltradas.length === 0 ? (

                                <p
                                    style={{
                                        fontSize: "0.8rem",
                                        color: "#94a3b8",
                                        margin: "8px 0"
                                    }}
                                >
                                    Sin nuevas alertas.
                                </p>

                            ) : (

                                <div
                                    style={{
                                        maxHeight: "200px",
                                        overflowY: "auto"
                                    }}
                                >

                                    {notifFiltradas.map(n => (

                                        <div
                                            key={n.id}
                                            style={{
                                                padding: "8px",
                                                borderBottom:
                                                    "1px solid #334155",
                                                fontSize: "0.8rem",
                                                color: "#cbd5e1"
                                            }}
                                        >

                                            <p
                                                style={{
                                                    margin: 0
                                                }}
                                            >
                                                {n.mensaje}
                                            </p>

                                            <span
                                                style={{
                                                    fontSize: "0.7rem",
                                                    color: "#64748b"
                                                }}
                                            >
                                                {n.tiempo}
                                            </span>

                                        </div>

                                    ))}

                                </div>

                            )}

                        </div>

                    )}

                </div>


                {/* ==========================================
                    USUARIO
                ========================================== */}

                <div
                    className="header-user"
                    onClick={() =>
                        setMostrarMenuUsuario(
                            !mostrarMenuUsuario
                        )
                    }
                    style={{
                        position: "relative",
                        cursor: "pointer"
                    }}
                >

                    <div className="header-avatar">

                        {nombreUsuario
                            .substring(0, 2)
                            .toUpperCase()}

                    </div>


                    <div className="header-user-info">

                        <strong>
                            {nombreUsuario}
                        </strong>

                        <span>
                            {rolActivo}
                        </span>

                    </div>


                    {/* ==========================================
                        MENU USUARIO
                    ========================================== */}

                    {mostrarMenuUsuario && (

                        <div
                            style={{
                                position: "absolute",
                                top: "55px",
                                right: 0,
                                width: "220px",
                                background: "#1e293b",
                                border:
                                    "1px solid #334155",
                                borderRadius: "8px",
                                boxShadow:
                                    "0 10px 25px rgba(0,0,0,0.5)",
                                padding: "8px",
                                zIndex: 200
                            }}
                        >

                            {/* Información */}

                            <div
                                style={{
                                    padding: "10px",
                                    borderBottom:
                                        "1px solid #334155",
                                    marginBottom: "6px"
                                }}
                            >

                                <strong
                                    style={{
                                        display: "block",
                                        color: "#f8fafc"
                                    }}
                                >
                                    {nombreUsuario}
                                </strong>

                                <span
                                    style={{
                                        fontSize: "0.8rem",
                                        color: "#94a3b8"
                                    }}
                                >
                                    {usuario?.email}
                                </span>

                            </div>


                            {/* Cerrar sesión */}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    cerrarSesion();
                                }}
                                style={{
                                    width: "100%",
                                    border: "none",
                                    background: "transparent",
                                    color: "#f87171",
                                    padding: "10px",
                                    textAlign: "left",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "0.9rem"
                                }}
                            >
                                🚪 Cerrar sesión
                            </button>

                        </div>

                    )}

                </div>

            </div>

        </header>
    );
}

export default Header;