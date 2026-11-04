import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../../context/authContext";
import { login, loginDemo } from "../../services/authService";
import { BrandMark, VehicleSilhouette } from "../../components/Brand/Brand";
import "./Login.css";

function Login() {
    const navigate = useNavigate();
    const { usuarioActual, iniciarSesion } = useRole();

    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [mostrarPassword, setMostrarPassword] = useState(false);

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (usuarioActual?.activo) {
            const destino = usuarioActual.rol?.trim() === "Técnico Automotriz" ? "/kanban" : "/dashboard";
            navigate(destino, { replace: true });
        }
    }, [navigate, usuarioActual]);


    // ==========================================
    // LOGIN
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setCargando(true);

        try {
            const data = await login(correo, password);


            // ==========================================
            // USUARIO DESACTIVADO
            // ==========================================
            if (!data.activo) {
                setError(
                    "Tu usuario está desactivado. Comunícate con el administrador."
                );

                return;
            }


            iniciarSesion(data);

            // ==========================================
            // IR AL DASHBOARD
            // ==========================================
            const destino = data.rol?.trim() === "Técnico Automotriz" ? "/kanban" : "/dashboard";
            navigate(destino, {
                replace: true
            });

        } catch (error) {
            console.error(
                "Error al iniciar sesión:",
                error
            );

            setError(error.message || "No se pudo conectar con el servidor. Verifica que FastAPI esté ejecutándose.");

        } finally {
            setCargando(false);
        }
    };


    const entrarModoDemo = async () => {
        setError("");
        setCargando(true);

        try {
            iniciarSesion(await loginDemo());
            navigate("/dashboard", { replace: true });
        } catch (error) {
            console.error("Error en modo demo:", error);
            setError(error.message || "No se pudo entrar en modo demo.");
        } finally {
            setCargando(false);
        }
    };


    return (
        <div className="login-page">

            {/* ==========================================
                PANEL DE MARCA
            ========================================== */}

            <aside className="login-panel">

                <div className="login-brand">
                    <BrandMark size={44} />
                    <div>
                        <h1>VERAMOTORS</h1>
                        <p>Sistema de Gestión Automotriz</p>
                    </div>
                </div>

                <VehicleSilhouette className="login-panel-auto" />

                <div className="login-mensaje">
                    <h2>Cada vehículo, <em>bajo control</em> de la recepción a la entrega.</h2>
                    <p>Citas, órdenes de servicio, diagnóstico, repuestos y facturación de tu taller en un solo lugar.</p>
                </div>

                <ul className="login-flujo">
                    <li><span className="material-symbols-outlined">car_repair</span>Órdenes de servicio</li>
                    <li><span className="material-symbols-outlined">inventory_2</span>Inventario</li>
                    <li><span className="material-symbols-outlined">receipt_long</span>Facturación SUNAT</li>
                </ul>

            </aside>


            <main className="login-form-side">

                <div className="login-container">

                    <div className="login-brand login-brand-movil">
                        <BrandMark size={40} />
                        <div>
                            <h1>VERAMOTORS</h1>
                            <p>Sistema de Gestión Automotriz</p>
                        </div>
                    </div>


                    {/* ==========================================
                        TARJETA LOGIN
                    ========================================== */}

                    <div className="login-card">

                        <div className="login-header">
                            <h2>Bienvenido</h2>
                            <p>Ingresa tus credenciales para continuar</p>
                        </div>


                        {/* ==========================================
                            ERROR
                        ========================================== */}

                        {error && (
                            <div className="vm-alert" role="alert">
                                <span className="material-symbols-outlined">error</span>
                                <span>{error}</span>
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
                                className="vm-btn vm-btn-accent login-button"
                                disabled={cargando}
                            >
                                {cargando
                                    ? "Iniciando sesión..."
                                    : "Iniciar sesión"}
                            </button>

                            {/* Entra como Administrador sin contraseña: solo en desarrollo */}
                            {import.meta.env.DEV && (
                                <button
                                    type="button"
                                    className="vm-btn vm-btn-secondary login-button is-demo"
                                    disabled={cargando}
                                    onClick={entrarModoDemo}
                                >
                                    <span className="material-symbols-outlined">rocket_launch</span>
                                    Entrar en Modo Demo
                                </button>
                            )}
                        </form>

                    </div>


                    {/* ==========================================
                        FOOTER
                    ========================================== */}

                    <p className="login-footer">
                        © 2026 VeraMotors SAC
                    </p>

                </div>

            </main>

        </div>
    );
}

export default Login;