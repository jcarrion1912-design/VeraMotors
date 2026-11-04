import { useEffect, useState } from "react";
import "./Citas.css";
import { obtenerCitas, obtenerVehiculosCliente, crearCita } from "../../services/citaService";
import { obtenerClientes } from "../../services/clientesService";
import ModalNuevoCliente from "../../components/ModalNuevoCliente/ModalNuevoCliente";

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
    const [mostrarModalNuevoCliente, setMostrarModalNuevoCliente] = useState(false);

    const handleClienteCreadoDesdeCita = async ({ cliente: nuevoCli, vehiculo: nuevoVeh }) => {
        setMostrarModalNuevoCliente(false);
        await cargarClientes();
        if (nuevoCli?.cliente_id) {
            const nuevoCliId = String(nuevoCli.cliente_id);
            const nuevoVehId = nuevoVeh?.vehiculo_id ? String(nuevoVeh.vehiculo_id) : "";
            setFormData((prev) => ({
                ...prev,
                cliente_id: nuevoCliId,
                vehiculo_id: nuevoVehId
            }));
            try {
                const vehs = await obtenerVehiculosCliente(nuevoCli.cliente_id);
                setVehiculos(Array.isArray(vehs) ? vehs : []);
            } catch (err) {
                console.error("Error al cargar vehículos del nuevo cliente:", err);
            }
        }
    };

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
        <div className="citas-page citas-content">
            <div className="citas-header-title">
                <h2>Citas</h2>
                <p>Gestión de mantenimiento semanal</p>
            </div>

            <div className="vm-filter-bar citas-toolbar">
                <div className="vm-search citas-search">
                    <span className="material-symbols-outlined">search</span>
                    <input type="search" placeholder="Buscar cliente, placa u observación..." value={busqueda} onChange={(event) => setBusqueda(event.target.value)} aria-label="Buscar cliente, placa u observación" />
                </div>

                <button className="vm-icon-btn citas-top-action" onClick={() => setShowNewAppointment(true)} title="Registrar cita" aria-label="Registrar cita">
                    <span className="material-symbols-outlined">add_circle</span>
                </button>

                <div className="citas-date-selector">
                    <button type="button" onClick={() => setFechaReferencia((fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - 7))} aria-label="Semana anterior"><span className="material-symbols-outlined">chevron_left</span></button>
                    <span className="citas-date">{diasSemana[0].toLocaleDateString("es-PE")} – {diasSemana[6].toLocaleDateString("es-PE")}</span>
                    <button type="button" onClick={() => setFechaReferencia((fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 7))} aria-label="Semana siguiente"><span className="material-symbols-outlined">chevron_right</span></button>
                </div>

                <select className="citas-filter-select" value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)} aria-label="Filtrar por estado">
                    <option value="Todos">Todos los estados</option>
                    {estadosDisponibles.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                </select>
            </div>

            <button className="citas-new-button" onClick={() => setShowNewAppointment(true)}>
                <span className="material-symbols-outlined">add</span>
                Nueva Cita
            </button>

            <div className="vm-card citas-calendar">
                <div className="calendar-scroll">
                    <div className="calendar-days">
                        <div className="calendar-day calendar-day-hora"><span className="calendar-day-label">Hora</span></div>
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
                                                    <div className={`calendar-appointment appointment-${String(estado).toLowerCase()}`}>
                                                        <div className="appointment-status"><span className="appointment-dot"></span>{estado}</div>
                                                        <h4 className="appointment-name">{cita.cliente_nombre}</h4>
                                                        <p className={cita.vehiculo_placa ? "vm-plate appointment-vehicle" : "appointment-sin-vehiculo"}>{cita.vehiculo_placa || "Sin vehículo"}</p>
                                                        <div className="appointment-end"><span className="material-symbols-outlined">schedule</span>Hasta {fin.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false })}</div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            }) : (
                                <div className="vm-empty calendar-empty">
                                    <span className="material-symbols-outlined">event_busy</span>
                                    <strong>No hay citas para esta semana</strong>
                                    Cambia de semana o ajusta la búsqueda y el estado.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`appointment-overlay ${showNewAppointment ? "open" : ""}`} onClick={() => setShowNewAppointment(false)}></div>

            <aside className={`new-appointment-sidebar ${showNewAppointment ? "open" : ""}`}>
                <div className="new-appointment-header">
                    <h3>Nueva Cita Programada</h3>
                    <button className="btn-close" onClick={() => setShowNewAppointment(false)} aria-label="Cerrar">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form className="new-appointment-body" onSubmit={guardarCita}>
                    <div className="new-appointment-scroll">
                        <div className="form-section">
                            <div className="citas-seccion-head">
                                <h4 className="vm-form-section-title">
                                    <span className="material-symbols-outlined">person</span>
                                    Cliente
                                </h4>
                                <button
                                    type="button"
                                    className="vm-btn vm-btn-secondary vm-btn-sm"
                                    onClick={() => setMostrarModalNuevoCliente(true)}
                                    title="Registrar un nuevo cliente sin salir de la cita"
                                >
                                    <span className="material-symbols-outlined">person_add</span>
                                    Registrar cliente
                                </button>
                            </div>
                            <div className="form-group">
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
                            <h4 className="vm-form-section-title">
                                <span className="material-symbols-outlined">directions_car</span>
                                Vehículo
                            </h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Placa / vehículo</label>
                                    <select name="vehiculo_id" value={formData.vehiculo_id} onChange={manejarCambio} disabled={!formData.cliente_id}>
                                        <option value="">Sin vehículo asociado</option>
                                        {vehiculos.map((vehiculo) => <option key={vehiculo.vehiculo_id} value={vehiculo.vehiculo_id}>{vehiculo.placa} · {vehiculo.marca} {vehiculo.modelo}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
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
                            <h4 className="vm-form-section-title">
                                <span className="material-symbols-outlined">schedule</span>
                                Fecha y hora
                            </h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Inicio</label>
                                    <input type="datetime-local" name="fecha_hora_inicio" value={formData.fecha_hora_inicio} onChange={manejarCambio} required />
                                </div>
                                <div className="form-group">
                                    <label>Fin</label>
                                    <input type="datetime-local" name="fecha_hora_fin" value={formData.fecha_hora_fin} onChange={manejarCambio} required />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h4 className="vm-form-section-title">
                                <span className="material-symbols-outlined">note_alt</span>
                                Observaciones
                            </h4>
                            <div className="form-group">
                                <label>Comentarios</label>
                                <textarea name="observaciones" rows="3" value={formData.observaciones} onChange={manejarCambio} placeholder="Describa el motivo o servicio de la cita..."></textarea>
                            </div>
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

            <ModalNuevoCliente
                isOpen={mostrarModalNuevoCliente}
                onClose={() => setMostrarModalNuevoCliente(false)}
                onClienteRegistrado={handleClienteCreadoDesdeCita}
            />
        </div>
    );
}

export default Citas;