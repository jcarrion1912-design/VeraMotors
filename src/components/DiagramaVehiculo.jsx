import { useState } from "react";
import "./DiagramaVehiculo.css";

const zonasVehiculo = [
    { id: "capot", nombre: "Capó", x: 125, y: 95, width: 150, height: 55 },
    { id: "parabrisas", nombre: "Parabrisas", x: 120, y: 155, width: 160, height: 55 },
    { id: "techo", nombre: "Techo", x: 115, y: 215, width: 170, height: 120 },
    { id: "luneta", nombre: "Luneta", x: 120, y: 345, width: 160, height: 55 },

    { id: "parachoques_delantero", nombre: "Parachoques delantero", x: 115, y: 40, width: 170, height: 35 },
    { id: "parachoques_trasero", nombre: "Parachoques trasero", x: 115, y: 420, width: 170, height: 35 },

    { id: "puerta_delantera_izq", nombre: "Puerta delantera izquierda", x: 75, y: 210, width: 35, height: 90 },
    { id: "puerta_trasera_izq", nombre: "Puerta trasera izquierda", x: 75, y: 305, width: 35, height: 80 },

    { id: "puerta_delantera_der", nombre: "Puerta delantera derecha", x: 290, y: 210, width: 35, height: 90 },
    { id: "puerta_trasera_der", nombre: "Puerta trasera derecha", x: 290, y: 305, width: 35, height: 80 },

    { id: "guardabarros_delantero_izq", nombre: "Guardabarros delantero izquierdo", x: 55, y: 130, width: 45, height: 65 },
    { id: "guardabarros_delantero_der", nombre: "Guardabarros delantero derecho", x: 300, y: 130, width: 45, height: 65 },

    { id: "guardabarros_trasero_izq", nombre: "Guardabarros trasero izquierdo", x: 55, y: 365, width: 45, height: 65 },
    { id: "guardabarros_trasero_der", nombre: "Guardabarros trasero derecho", x: 300, y: 365, width: 45, height: 65 }
];

function DiagramaVehiculo({ danios, setDanios, onChange }) {
    const [danoLocal, setDanoLocal] = useState({});
    const datosActivos = danios ?? danoLocal;
    const actualizarDanos = (nuevosDanos) => {
        if (setDanios) {
            setDanios(nuevosDanos);
        } else {
            setDanoLocal(nuevosDanos);
        }

        if (onChange) {
            onChange(nuevosDanos);
        }
    };

    const cambiarEstado = (zonaId) => {
        const estadoActual = datosActivos[zonaId] || "intacto";

        let nuevoEstado;

        if (estadoActual === "intacto") {
            nuevoEstado = "rayado";
        } else if (estadoActual === "rayado") {
            nuevoEstado = "golpeado";
        } else {
            nuevoEstado = "intacto";
        }

        const nuevosDanos = { ...datosActivos };

        if (nuevoEstado === "intacto") {
            delete nuevosDanos[zonaId];
        } else {
            nuevosDanos[zonaId] = nuevoEstado;
        }

        actualizarDanos(nuevosDanos);
    };

    const obtenerClase = (zonaId) => {
        const estado = datosActivos[zonaId] || "intacto";

        if (estado === "rayado") {
            return "zona-vehiculo zona-leve";
        }

        if (estado === "golpeado") {
            return "zona-vehiculo zona-grave";
        }

        return "zona-vehiculo";
    };

    const obtenerEstado = (zonaId) => {
        return datosActivos[zonaId] || "intacto";
    };

    const cantidadDanos = Object.keys(datosActivos).length;

    return (
        <div className="vm-card diagrama-vehiculo">

            <div className="vm-card-head diagrama-header">
                <div>
                    <h3>Inspección visual del vehículo</h3>
                    <p>
                        Haz clic sobre una parte del vehículo para registrar un daño.
                    </p>
                </div>

                <div className="contador-danos">
                    <span className="material-symbols-outlined">
                        car_crash
                    </span>

                    <strong>{cantidadDanos}</strong>

                    <span>
                        {cantidadDanos === 1 ? "daño" : "daños"}
                    </span>
                </div>
            </div>

            <div className="diagrama-contenido">

                <div className="vehiculo-wrapper">

                    <svg
                        className="vehiculo-svg"
                        viewBox="0 0 400 500"
                        xmlns="http://www.w3.org/2000/svg"
                    >

                        {/* Sombra */}
                        <ellipse
                            cx="200"
                            cy="250"
                            rx="145"
                            ry="215"
                            className="vehiculo-sombra"
                        />

                        {/* Carro completo */}
                        <rect
                            x="95"
                            y="55"
                            width="210"
                            height="400"
                            rx="65"
                            className="carro-base"
                        />

                        {/* Parachoques delantero */}
                        <rect
                            x="115"
                            y="40"
                            width="170"
                            height="35"
                            rx="12"
                            className={obtenerClase("parachoques_delantero")}
                            onClick={() =>
                                cambiarEstado("parachoques_delantero")
                            }
                        />

                        {/* Capó */}
                        <rect
                            x="125"
                            y="95"
                            width="150"
                            height="55"
                            rx="10"
                            className={obtenerClase("capot")}
                            onClick={() => cambiarEstado("capot")}
                        />

                        {/* Parabrisas */}
                        <path
                            d="M120 160 Q200 145 280 160 L265 205 Q200 218 135 205 Z"
                            className={obtenerClase("parabrisas")}
                            onClick={() => cambiarEstado("parabrisas")}
                        />

                        {/* Techo */}
                        <rect
                            x="115"
                            y="215"
                            width="170"
                            height="120"
                            rx="18"
                            className={obtenerClase("techo")}
                            onClick={() => cambiarEstado("techo")}
                        />

                        {/* Luneta */}
                        <path
                            d="M135 345 Q200 335 265 345 L280 390 Q200 405 120 390 Z"
                            className={obtenerClase("luneta")}
                            onClick={() => cambiarEstado("luneta")}
                        />

                        {/* Parachoques trasero */}
                        <rect
                            x="115"
                            y="420"
                            width="170"
                            height="35"
                            rx="12"
                            className={obtenerClase("parachoques_trasero")}
                            onClick={() =>
                                cambiarEstado("parachoques_trasero")
                            }
                        />

                        {/* Puerta delantera izquierda */}
                        <rect
                            x="75"
                            y="210"
                            width="35"
                            height="90"
                            rx="6"
                            className={obtenerClase("puerta_delantera_izq")}
                            onClick={() =>
                                cambiarEstado("puerta_delantera_izq")
                            }
                        />

                        {/* Puerta trasera izquierda */}
                        <rect
                            x="75"
                            y="305"
                            width="35"
                            height="80"
                            rx="6"
                            className={obtenerClase("puerta_trasera_izq")}
                            onClick={() =>
                                cambiarEstado("puerta_trasera_izq")
                            }
                        />

                        {/* Puerta delantera derecha */}
                        <rect
                            x="290"
                            y="210"
                            width="35"
                            height="90"
                            rx="6"
                            className={obtenerClase("puerta_delantera_der")}
                            onClick={() =>
                                cambiarEstado("puerta_delantera_der")
                            }
                        />

                        {/* Puerta trasera derecha */}
                        <rect
                            x="290"
                            y="305"
                            width="35"
                            height="80"
                            rx="6"
                            className={obtenerClase("puerta_trasera_der")}
                            onClick={() =>
                                cambiarEstado("puerta_trasera_der")
                            }
                        />

                        {/* Guardabarros delantero izquierdo */}
                        <rect
                            x="55"
                            y="130"
                            width="45"
                            height="65"
                            rx="15"
                            className={obtenerClase(
                                "guardabarros_delantero_izq"
                            )}
                            onClick={() =>
                                cambiarEstado(
                                    "guardabarros_delantero_izq"
                                )
                            }
                        />

                        {/* Guardabarros delantero derecho */}
                        <rect
                            x="300"
                            y="130"
                            width="45"
                            height="65"
                            rx="15"
                            className={obtenerClase(
                                "guardabarros_delantero_der"
                            )}
                            onClick={() =>
                                cambiarEstado(
                                    "guardabarros_delantero_der"
                                )
                            }
                        />

                        {/* Guardabarros trasero izquierdo */}
                        <rect
                            x="55"
                            y="365"
                            width="45"
                            height="65"
                            rx="15"
                            className={obtenerClase(
                                "guardabarros_trasero_izq"
                            )}
                            onClick={() =>
                                cambiarEstado(
                                    "guardabarros_trasero_izq"
                                )
                            }
                        />

                        {/* Guardabarros trasero derecho */}
                        <rect
                            x="300"
                            y="365"
                            width="45"
                            height="65"
                            rx="15"
                            className={obtenerClase(
                                "guardabarros_trasero_der"
                            )}
                            onClick={() =>
                                cambiarEstado(
                                    "guardabarros_trasero_der"
                                )
                            }
                        />

                        {/* Ruedas */}
                        <rect
                            x="62"
                            y="185"
                            width="38"
                            height="55"
                            rx="15"
                            className="rueda"
                        />

                        <rect
                            x="300"
                            y="185"
                            width="38"
                            height="55"
                            rx="15"
                            className="rueda"
                        />

                        <rect
                            x="62"
                            y="335"
                            width="38"
                            height="55"
                            rx="15"
                            className="rueda"
                        />

                        <rect
                            x="300"
                            y="335"
                            width="38"
                            height="55"
                            rx="15"
                            className="rueda"
                        />

                    </svg>

                    <div className="indicador-delante">
                        <span>DELANTE</span>
                        <span className="material-symbols-outlined">
                            arrow_upward
                        </span>
                    </div>

                </div>

                <div className="diagrama-leyenda">

                    <h4>Estado del daño</h4>

                    <div className="leyenda-item">
                        <span className="leyenda-color normal"></span>
                        <span>Sin daño</span>
                    </div>

                    <div className="leyenda-item">
                        <span className="leyenda-color leve"></span>
                        <span>Daño leve</span>
                    </div>

                    <div className="leyenda-item">
                        <span className="leyenda-color grave"></span>
                        <span>Daño grave</span>
                    </div>

                    <div className="diagrama-ayuda">
                        <span className="material-symbols-outlined">
                            touch_app
                        </span>

                        <p>
                            Haz clic varias veces sobre una zona para cambiar
                            su estado.
                        </p>
                    </div>

                </div>
            </div>

            {cantidadDanos > 0 && (
                <div className="danos-registrados">

                    <div className="danos-registrados-header">
                        <h4>Daños registrados</h4>

                        <span>{cantidadDanos}</span>
                    </div>

                    <div className="danos-lista">

                        {Object.entries(datosActivos).map(([id, estado]) => {
                            const zona = zonasVehiculo.find(
                                (item) => item.id === id
                            );

                            const esGrave = estado === "grave" || estado === "golpeado";

                            return (
                                <div
                                    className={`danio-item ${esGrave ? "danio-grave" : "danio-leve"}`}
                                    key={id}
                                >
                                    <div className="danio-icono">
                                        <span className="material-symbols-outlined">
                                            {esGrave
                                                ? "report_problem"
                                                : "warning"}
                                        </span>
                                    </div>

                                    <div className="danio-info">
                                        <strong>{zona?.nombre || id}</strong>

                                        <span>
                                            {esGrave
                                                ? "Daño grave (Golpeado / Hundido)"
                                                : "Daño leve (Rayado / Raspón)"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                </div>
            )}
        </div>
    );
}

export default DiagramaVehiculo;