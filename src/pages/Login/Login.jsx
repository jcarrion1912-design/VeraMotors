import { useState } from "react";
import "./Login.css";

function Login() {
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [mostrarPassword, setMostrarPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log("Correo:", correo);
        console.log("Password:", password);
    };

    return (
        <div className="login-page">

            <div className="login-container">

                <div className="login-brand">
                    <div className="brand-logo">
                        VM
                    </div>

                    <h1>VERAMOTORS</h1>
                    <p>Sistema de Gestión Automotriz</p>
                </div>

                <div className="login-card">

                    <div className="login-header">
                        <h2>Bienvenido</h2>
                        <p>Ingresa tus credenciales para continuar</p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="form-group">
                            <label htmlFor="correo">
                                Correo electrónico
                            </label>

                            <input
                                id="correo"
                                type="email"
                                placeholder="correo@veramotors.com"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                Contraseña
                            </label>

                            <div className="password-container">
                                <input
                                    id="password"
                                    type={mostrarPassword ? "text" : "password"}
                                    placeholder="Ingresa tu contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setMostrarPassword(!mostrarPassword)
                                    }
                                >
                                    {mostrarPassword ? "Ocultar" : "Ver"}
                                </button>
                            </div>
                        </div>

                        <div className="login-options">
                            <label className="remember-me">
                                <input type="checkbox" />
                                <span>Recordarme</span>
                            </label>

                            <button
                                type="button"
                                className="forgot-password"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        <button type="submit" className="login-button">
                            Iniciar sesión
                        </button>

                    </form>

                </div>

                <p className="login-footer">
                    © 2026 VeraMotors SAC
                </p>

            </div>

        </div>
    );
}

export default Login;