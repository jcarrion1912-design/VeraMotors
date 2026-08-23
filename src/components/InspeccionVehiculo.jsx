import { useState } from "react";
import DiagramaVehiculo from "./DiagramaVehiculo";
import "./InspeccionVehiculo.css";

function InspeccionVehiculo() {
    const [danos, setDanos] = useState({});
    const [observaciones, setObservaciones] = useState("");
    const [estadoVehiculo, setEstadoVehiculo] = useState("Pendiente");

    const cantidadDanos = Object.keys(danos).length;

    const handleDaniosChange = (nuevosDanos) => {
        setDanos(nuevosDanos);
    };

    const limpiarInspeccion = () => {
        setDanos({});
        setObservaciones("");
        setEstadoVehiculo("Pendiente");
    };

    const finalizarInspeccion = () => {
        setEstadoVehiculo("Completada");

        console.log("Inspección:", {
            danos,
            observaciones,
            estado: "Completada"
        });
    };

    return (
        <div className="inspeccion-vehiculo">

            {/* CABECERA */}
            <div className="inspeccion-header">

                <div>
                    <div className="inspeccion-titulo">
                        <span className="material-symbols-outlined">
                            car_repair
                        </span>

                        <div>
                            <h2>Inspección del vehículo</h2>
                            <p>
                                Registra visualmente los daños encontrados
                                durante la recepción del vehículo.
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className={`inspeccion-estado estado-${estadoVehiculo.toLowerCase()}`}
                >
                    <span className="estado-punto"></span>
                    {estadoVehiculo}
                </div>

            </div>

            {/* INFORMACIÓN DEL VEHÍCULO */}
            <div className="vehiculo-resumen">

                <div className="vehiculo-resumen-item">
                    <span className="material-symbols-outlined">
                        directions_car
                    </span>

                    <div>
                        <span className="resumen-label">Vehículo</span>
                        <strong>Toyota Corolla</strong>
                    </div>
                </div>

                <div className="vehiculo-resumen-item">
                    <span className="material-symbols-outlined">
                        pin
                    </span>

                    <div>
                        <span className="resumen-label">Placa</span>
                        <strong>ABC-123</strong>
                    </div>
                </div>

                <div className="vehiculo-resumen-item">
                    <span className="material-symbols-outlined">
                        palette
                    </span>

                    <div>
                        <span className="resumen-label">Color</span>
                        <strong>Blanco</strong>
                    </div>
                </div>

                <div className="vehiculo-resumen-item">
                    <span className="material-symbols-outlined">
                        calendar_month
                    </span>

                    <div>
                        <span className="resumen-label">Año</span>
                        <strong>2022</strong>
                    </div>
                </div>

            </div>

            {/* DIAGRAMA */}
            <div className="inspeccion-diagrama">

                <DiagramaVehiculo
                    onChange={handleDaniosChange}
                />

            </div>

            {/* OBSERVACIONES */}
            <div className="inspeccion-observaciones">

                <div className="seccion-titulo">
                    <div>
                        <span className="material-symbols-outlined">
                            description
                        </span>

                        <div>
                            <h3>Observaciones generales</h3>
                            <p>
                                Agrega información adicional sobre el estado
                                del vehículo.
                            </p>
                        </div>
                    </div>
                </div>

                <textarea
                    value={observaciones}
                    onChange={(e) =>
                        setObservaciones(e.target.value)
                    }
                    placeholder="Ejemplo: El vehículo presenta rayones en la parte lateral derecha, golpe leve en el parachoques delantero..."
                    rows="5"
                />

            </div>

            {/* RESUMEN */}
            <div className="inspeccion-resumen">

                <div className="resumen-card">

                    <div className="resumen-card-icono">
                        <span className="material-symbols-outlined">
                            car_crash
                        </span>
                    </div>

                    <div>
                        <span className="resumen-card-label">
                            Daños registrados
                        </span>

                        <strong>
                            {cantidadDanos}
                        </strong>
                    </div>

                </div>

                <div className="resumen-card">

                    <div className="resumen-card-icono">
                        <span className="material-symbols-outlined">
                            description
                        </span>
                    </div>

                    <div>
                        <span className="resumen-card-label">
                            Observaciones
                        </span>

                        <strong>
                            {observaciones.trim() ? "Sí" : "No"}
                        </strong>
                    </div>

                </div>

                <div className="resumen-card">

                    <div className="resumen-card-icono">
                        <span className="material-symbols-outlined">
                            verified
                        </span>
                    </div>

                    <div>
                        <span className="resumen-card-label">
                            Estado
                        </span>

                        <strong>
                            {estadoVehiculo}
                        </strong>
                    </div>

                </div>

            </div>

            {/* BOTONES */}
            <div className="inspeccion-acciones">

                <button
                    type="button"
                    className="btn-limpiar-inspeccion"
                    onClick={limpiarInspeccion}
                >
                    <span className="material-symbols-outlined">
                        restart_alt
                    </span>

                    Limpiar inspección
                </button>

                <button
                    type="button"
                    className="btn-finalizar-inspeccion"
                    onClick={finalizarInspeccion}
                >
                    <span className="material-symbols-outlined">
                        check_circle
                    </span>

                    Finalizar inspección
                </button>

            </div>

        </div>
    );
}

export default InspeccionVehiculo;