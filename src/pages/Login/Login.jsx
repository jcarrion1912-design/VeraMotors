import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [mostrarPassword, setMostrarPassword] = useState(false);

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    // ==========================================
    // SI YA HAY SESIÓN, NO MOSTRAR LOGIN
    // ==========================================
    useEffect(() => {
        const usuarioGuardado = localStorage.getItem("usuario");

        if (!usuarioGuardado) {
            return;
        }

        try {
            const usuario = JSON.parse(usuarioGuardado);

            if (usuario && usuario.activo) {
                navigate("/dashboard", { replace: true });
            } else {
                localStorage.removeItem("usuario");
                localStorage.removeItem("loginTime");
            }

        } catch (error) {
            console.error("Sesión inválida:", error);

            localStorage.removeItem("usuario");
            localStorage.removeItem("loginTime");
        }
    }, [navigate]);


    // ==========================================
    // LOGIN
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setCargando(true);

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },

                    body: JSON.stringify({
                        email: correo,
                        password: password,
                    }),
                }
            );

            const data = await response.json();


            // ==========================================
            // LOGIN INCORRECTO
            // ==========================================
            if (!response.ok) {
                setError(
                    data.detail ||
                    "Correo o contraseña incorrectos."
                );

                return;
            }


            // ==========================================
            // USUARIO DESACTIVADO
            // ==========================================
            if (!data.activo) {
                setError(
                    "Tu usuario está desactivado. Comunícate con el administrador."
                );

                return;
            }


            // ==========================================
            // GUARDAR USUARIO
            // ==========================================
            localStorage.setItem(
                "usuario",
                JSON.stringify(data)
            );


            // ==========================================
            // GUARDAR HORA DE LOGIN
            // ==========================================
            localStorage.setItem(
                "loginTime",
                Date.now().toString()
            );


            // ==========================================
            // IR AL DASHBOARD
            // ==========================================
            navigate("/dashboard", {
                replace: true
            });

        } catch (error) {
            console.error(
                "Error al iniciar sesión:",
                error
            );

            setError(
                "No se pudo conectar con el servidor. Verifica que FastAPI esté ejecutándose."
            );

        } finally {
            setCargando(false);
        }
    };


    return (
        <div className="login-page">

            <div className="login-container">

                {/* ==========================================
                    MARCA
                ========================================== */}

                <div className="login-brand">

                    <div className="brand-logo">
                        VM
                    </div>

                    <h1>
                        VERAMOTORS
                    </h1>

                    <p>
                        Sistema de Gestión Automotriz
                    </p>

                </div>


                {/* ==========================================
                    TARJETA LOGIN
                ========================================== */}

                <div className="login-card">

                    <div className="login-header">

                        <h2>
                            Bienvenido
                        </h2>

                        <p>
                            Ingresa tus credenciales para continuar
                        </p>

                    </div>


                    {/* ==========================================
                        ERROR
                    ========================================== */}

                    {error && (
                        <div
                            style={{
                                background: "#fee2e2",
                                color: "#b91c1c",
                                padding: "10px 12px",
                                borderRadius: "6px",
                                marginBottom: "16px",
                                fontSize: "0.9rem",
                                border: "1px solid #fecaca",
                            }}
                        >
                            {error}
                        </div>
                    )}


                    <form onSubmit={handleSubmit}>

                        {/* ==========================================
                            CORREO
                        ========================================== */}

                        <div className="form-group">

                            <label htmlFor="correo">
                                Correo electrónico
                            </label>

                            <input
                                id="correo"
                                type="email"
                                placeholder="correo@veramotors.com"
                                value={correo}
                                onChange={(e) =>
                                    setCorreo(e.target.value)
                                }
                                required
                                disabled={cargando}
                            />

                        </div>


                        {/* ==========================================
                            CONTRASEÑA
                        ========================================== */}

                        <div className="form-group">

                            <label htmlFor="password">
                                Contraseña
                            </label>

                            <div className="password-container">

                                <input
                                    id="password"
                                    type={
                                        mostrarPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Ingresa tu contraseña"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    disabled={cargando}
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setMostrarPassword(
                                            !mostrarPassword
                                        )
                                    }
                                    disabled={cargando}
                                >
                                    {mostrarPassword
                                        ? "Ocultar"
                                        : "Ver"}
                                </button>

                            </div>

                        </div>


                        {/* ==========================================
                            OPCIONES
                        ========================================== */}

                        <div className="login-options">

                            <label className="remember-me">

                                <input
                                    type="checkbox"
                                    disabled={cargando}
                                />

                                <span>
                                    Recordarme
                                </span>

                            </label>


                            <button
                                type="button"
                                className="forgot-password"
                                disabled={cargando}
                                onClick={() =>
                                    alert(
                                        "La recuperación de contraseña estará disponible próximamente."
                                    )
                                }
                            >
                                ¿Olvidaste tu contraseña?
                            </button>

                        </div>


                        {/* ==========================================
                            BOTÓN LOGIN
                        ========================================== */}

                        <button
                            type="submit"
                            className="login-button"
                            disabled={cargando}
                        >
                            {cargando
                                ? "Iniciando sesión..."
                                : "Iniciar sesión"}
                        </button>

                    </form>

                </div>


                {/* ==========================================
                    FOOTER
                ========================================== */}

                <p className="login-footer">
                    © 2026 VeraMotors SAC
                </p>

            </div>

        </div>
    );
}

export default Login;