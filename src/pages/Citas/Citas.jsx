import { useEffect, useState } from "react";
import "./Citas.css";
import { obtenerCitas, obtenerVehiculosCliente, crearCita } from "../../services/citaService";
import { obtenerClientes } from "../../services/clientesService";

const estadoInicial = {
    cliente_id: "",
    vehiculo_id: "",
    fecha_hora_inicio: "",
    fecha_hora_fin: "",
    estado: "Pendiente",
    observaciones: ""
};

function Citas() {
    const [citas, setCitas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [showNewAppointment, setShowNewAppointment] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [formData, setFormData] = useState(estadoInicial);
    const [busqueda, setBusqueda] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("Todos");
    const [fechaReferencia, setFechaReferencia] = useState(() => new Date());

    const cargarCitas = async () => {
        try {
            const data = await obtenerCitas();
            setCitas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando citas:", error);
        }
    };

    const cargarClientes = async () => {
        try {
            const data = await obtenerClientes();
            setClientes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando clientes:", error);
        }
    };

    useEffect(() => {
        let activa = true;
        queueMicrotask(() => {
            if (!activa) return;
            cargarCitas();
            cargarClientes();
        });
        return () => { activa = false; };
    }, []);

    useEffect(() => {
        let activa = true;
        if (!formData.cliente_id) {
            Promise.resolve().then(() => { if (activa) setVehiculos([]); });
            return () => { activa = false; };
        }
        obtenerVehiculosCliente(formData.cliente_id)
            .then((data) => { if (activa) setVehiculos(Array.isArray(data) ? data : []); })
            .catch(() => { if (activa) setVehiculos([]); });
        return () => { activa = false; };
    }, [formData.cliente_id]);

    const citasFiltradas = citas.filter((cita) => {
        const query = busqueda.trim().toLowerCase();
        const coincideTexto = !query || [cita.cliente_nombre, cita.vehiculo_placa, cita.observaciones].some((valor) => String(valor || "").toLowerCase().includes(query));
        return coincideTexto && (estadoFiltro === "Todos" || cita.estado === estadoFiltro);
    });
    const estadosDisponibles = [...new Set(citas.map((cita) => cita.estado).filter(Boolean))].sort();
    const inicioSemana = new Date(fechaReferencia);
    inicioSemana.setHours(0, 0, 0, 0);
    inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7));
    const diasSemana = Array.from({ length: 7 }, (_, index) => {
        const fechaDia = new Date(inicioSemana);
        fechaDia.setDate(inicioSemana.getDate() + index);
        return fechaDia;
    });
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 7);
    const citasSemana = citasFiltradas.filter((cita) => {
        const fechaInicio = new Date(cita.fecha_hora_inicio);
        return fechaInicio >= inicioSemana && fechaInicio < finSemana;
    }).sort((a, b) => new Date(a.fecha_hora_inicio) - new Date(b.fecha_hora_inicio));

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value, ...(name === "cliente_id" ? { vehiculo_id: "" } : {}) }));
    };

    const guardarCita = async (e) => {
        e.preventDefault();

        if (!formData.cliente_id) {
            alert("Debe seleccionar un cliente para registrar la cita.");
            return;
        }

        if (!formData.fecha_hora_inicio || !formData.fecha_hora_fin) {
            alert("Debe indicar la fecha y hora de inicio y fin.");
            return;
        }

        try {
            setGuardando(true);

            const payload = {
                cliente_id: Number(formData.cliente_id),
                vehiculo_id: formData.vehiculo_id ? Number(formData.vehiculo_id) : null,
                fecha_hora_inicio: new Date(formData.fecha_hora_inicio).toISOString(),
                fecha_hora_fin: new Date(formData.fecha_hora_fin).toISOString(),
                estado: formData.estado,
                observaciones: formData.observaciones || null
            };

            await crearCita(payload);
            setFormData(estadoInicial);
            setShowNewAppointment(false);
            await cargarCitas();
            alert("Cita registrada correctamente.");
        } catch (error) {
            console.error("Error creando cita:", error);
            alert(error.message || "No se pudo guardar la cita.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="citas-content">
            <header className="citas-topbar">
                <div className="citas-mobile-brand">
                    <span>VERAMOTORS</span>
                </div>

                <div className="citas-search">
                    <div className="citas-search-box">
                        <span className="material-symbols-outlined">search</span>
                        <input type="search" placeholder="Buscar cliente, placa u observación..." value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
                    </div>
                </div>

                <div className="citas-top-actions">
                    <button className="citas-top-action" onClick={() => setShowNewAppointment(true)} title="Registrar cita">
                        <span className="material-symbols-outlined">add_circle</span>
                    </button>
                </div>
            </header>

            <main className="citas-main">
                <div className="citas-container">
                    <div className="citas-header">
                        <div className="citas-header-title">
                            <h2>Citas</h2>
                            <p>Gestión de mantenimiento semanal</p>
                        </div>

                        <div className="citas-filters">
                            <div className="citas-date-selector">
                                <button type="button" onClick={() => setFechaReferencia((fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - 7))}><span className="material-symbols-outlined">chevron_left</span></button>
                                <span className="citas-date">{diasSemana[0].toLocaleDateString("es-PE")} – {diasSemana[6].toLocaleDateString("es-PE")}</span>
                                <button type="button" onClick={() => setFechaReferencia((fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 7))}><span className="material-symbols-outlined">chevron_right</span></button>
                            </div>

                            <select className="citas-filter-select" value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)}>
                                <option value="Todos">Todos los estados</option>
                                {estadosDisponibles.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                            </select>

                            <button className="citas-new-button" onClick={() => setShowNewAppointment(true)}>
                                <span className="material-symbols-outlined">add</span>
                                Nueva Cita
                            </button>
                        </div>
                    </div>

                    <div className="citas-calendar">
                        <div className="calendar-days">
                            <div className="calendar-day"><span className="calendar-day-label">Hora</span></div>
                            {diasSemana.map((dia) => (
                                <div key={dia.toISOString()} className={`calendar-day ${dia.toDateString() === new Date().toDateString() ? "today" : ""}`}>
                                    <span className="calendar-day-label">{dia.toLocaleDateString("es-PE", { weekday: "short" })}</span>
                                    <span className="calendar-day-number">{dia.getDate()}</span>
                                </div>
                            ))}
                        </div>

                        <div className="calendar-body">
                            <div className="calendar-grid">
                                {citasSemana.length > 0 ? citasSemana.map((cita) => {
                                    const inicio = new Date(cita.fecha_hora_inicio);
                                    const fin = new Date(cita.fecha_hora_fin);
                                    const hora = inicio.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
                                    const estado = cita.estado || "Pendiente";
                                    const diaCita = (inicio.getDay() + 6) % 7;

                                    return (
                                        <div key={cita.cita_id} className="calendar-row">
                                            <div className="calendar-time">{hora}</div>
                                            {diasSemana.map((dia, index) => (
                                                <div key={dia.toISOString()} className={`calendar-cell ${dia.toDateString() === new Date().toDateString() ? "today" : ""}`}>
                                                    {index === diaCita && (
                                                        <div className="calendar-appointment appointment-confirmed">
                                                            <div className="appointment-status"><span className="appointment-dot"></span>{estado}</div>
                                                            <h4 className="appointment-name">{cita.cliente_nombre}</h4>
                                                            <p className="appointment-vehicle">{cita.vehiculo_placa || "Sin vehículo"}</p>
                                                            <div className="appointment-technician"><span className="material-symbols-outlined">schedule</span>{fin.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false })}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }) : (
                                    <div className="calendar-row">
                                        <div className="calendar-cell" style={{ gridColumn: "1 / -1" }}>No hay citas registradas en la base de datos.</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <div className={`appointment-overlay ${showNewAppointment ? "open" : ""}`} onClick={() => setShowNewAppointment(false)}></div>

            <aside className={`new-appointment-sidebar ${showNewAppointment ? "open" : ""}`} style={{ width: "420px", maxWidth: "90vw" }}>
                <div className="new-appointment-header">
                    <h3>Nueva Cita Programada</h3>
                    <button className="new-appointment-close" onClick={() => setShowNewAppointment(false)}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form className="new-appointment-body" onSubmit={guardarCita}>
                    <div className="form-section">
                        <h4 className="form-section-title">
                            <span className="material-symbols-outlined">person</span>
                            Cliente
                        </h4>
                        <div className="form-field">
                            <label>Seleccionar cliente</label>
                            <select name="cliente_id" value={formData.cliente_id} onChange={manejarCambio} required>
                                <option value="">Seleccione un cliente</option>
                                {clientes.map((cliente) => (
                                    <option key={cliente.cliente_id} value={cliente.cliente_id}>
                                        {cliente.nombre_razon_social} - {cliente.documento_identidad}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <h4 className="form-section-title">
                            <span className="material-symbols-outlined">directions_car</span>
                            Vehículo
                        </h4>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Placa / vehículo</label>
                                <select name="vehiculo_id" value={formData.vehiculo_id} onChange={manejarCambio} disabled={!formData.cliente_id}>
                                    <option value="">Sin vehículo asociado</option>
                                    {vehiculos.map((vehiculo) => <option key={vehiculo.vehiculo_id} value={vehiculo.vehiculo_id}>{vehiculo.placa} · {vehiculo.marca} {vehiculo.modelo}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Estado</label>
                                <select name="estado" value={formData.estado} onChange={manejarCambio}>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Atendida">Atendida</option>
                                    <option value="Cancelada">Cancelada</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h4 className="form-section-title">
                            <span className="material-symbols-outlined">schedule</span>
                            Fecha y hora
                        </h4>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Inicio</label>
                                <input type="datetime-local" name="fecha_hora_inicio" value={formData.fecha_hora_inicio} onChange={manejarCambio} required />
                            </div>
                            <div className="form-field">
                                <label>Fin</label>
                                <input type="datetime-local" name="fecha_hora_fin" value={formData.fecha_hora_fin} onChange={manejarCambio} required />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h4 className="form-section-title">
                            <span className="material-symbols-outlined">note_alt</span>
                            Observaciones
                        </h4>
                        <div className="form-field">
                            <label>Comentarios</label>
                            <textarea name="observaciones" rows="3" value={formData.observaciones} onChange={manejarCambio} placeholder="Describa el motivo o servicio de la cita..."></textarea>
                        </div>
                    </div>

                    <div className="new-appointment-footer">
                        <button type="button" className="cancel-button" onClick={() => setShowNewAppointment(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="save-button" disabled={guardando}>
                            <span className="material-symbols-outlined">send</span>
                            {guardando ? "Guardando..." : "Agendar cita"}
                        </button>
                    </div>
                </form>
            </aside>
        </div>
    );
}

export default Citas;