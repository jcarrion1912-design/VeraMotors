import { useState } from "react";
import "./Citas.css";

function Citas() {
    const [showNewAppointment, setShowNewAppointment] = useState(false);
    const [esNuevoCliente, setEsNuevoCliente] = useState(false);
    const [tipoCliente, setTipoCliente] = useState("Natural");
    const [ubigeoDept, setUbigeoDept] = useState("Lima");
    const [ubigeoProv, setUbigeoProv] = useState("Lima");
    const [ubigeoDist, setUbigeoDist] = useState("Miraflores");
    const [duracionHoras, setDuracionHoras] = useState("3");

    return (
        <div className="citas-content">

            {/* TOPBAR */}
            <header className="citas-topbar">

                <div className="citas-mobile-brand">
                    <span>VERAMOTORS</span>
                </div>

                {/* BUSCADOR */}
                <div className="citas-search">
                    <div className="citas-search-box">
                        <span className="material-symbols-outlined">
                            search
                        </span>

                        <input
                            type="text"
                            placeholder="Buscar órdenes, clientes..."
                        />
                    </div>
                </div>

                {/* ACCIONES */}
                <div className="citas-top-actions">
                    <button className="citas-top-action">
                        <span className="material-symbols-outlined">
                            settings
                        </span>
                    </button>
                </div>

            </header>


            {/* CONTENIDO PRINCIPAL */}
            <main className="citas-main">

                <div className="citas-container">

                    {/* CABECERA */}
                    <div className="citas-header">

                        <div className="citas-header-title">
                            <h2>Citas</h2>

                            <p>
                                Gestión de mantenimiento semanal
                            </p>
                        </div>

                        {/* FILTROS */}
                        <div className="citas-filters">

                            {/* FECHA */}
                            <div className="citas-date-selector">

                                <button>
                                    <span className="material-symbols-outlined">
                                        chevron_left
                                    </span>
                                </button>

                                <span className="citas-date">
                                    16 - 22 Oct, 2023
                                </span>

                                <button>
                                    <span className="material-symbols-outlined">
                                        chevron_right
                                    </span>
                                </button>

                            </div>


                            {/* TÉCNICO */}
                            <select className="citas-filter-select">
                                <option>
                                    Todos los Técnicos
                                </option>

                                <option>
                                    Carlos M.
                                </option>

                                <option>
                                    Ana P.
                                </option>
                            </select>


                            {/* ESTADO */}
                            <select className="citas-filter-select">
                                <option>
                                    Todos los Estados
                                </option>

                                <option>
                                    Confirmada
                                </option>

                                <option>
                                    En Progreso
                                </option>

                                <option>
                                    Pendiente
                                </option>
                            </select>


                            {/* NUEVA CITA */}
                            <button
                                className="citas-new-button"
                                onClick={() => setShowNewAppointment(true)}
                            >
                                <span className="material-symbols-outlined">
                                    add
                                </span>

                                Nueva Cita
                            </button>

                        </div>

                    </div>


                    {/* CALENDARIO */}
                    <div className="citas-calendar">

                        {/* DÍAS */}
                        <div className="calendar-days">

                            <div className="calendar-day">
                                <span className="calendar-day-label">
                                    Hora
                                </span>
                            </div>

                            <div className="calendar-day">
                                <span className="calendar-day-label">
                                    Lun
                                </span>

                                <span className="calendar-day-number">
                                    16
                                </span>
                            </div>

                            <div className="calendar-day today">
                                <span className="calendar-day-label">
                                    Mar
                                </span>

                                <span className="calendar-day-number">
                                    17
                                </span>
                            </div>

                            <div className="calendar-day">
                                <span className="calendar-day-label">
                                    Mié
                                </span>

                                <span className="calendar-day-number">
                                    18
                                </span>
                            </div>

                            <div className="calendar-day">
                                <span className="calendar-day-label">
                                    Jue
                                </span>

                                <span className="calendar-day-number">
                                    19
                                </span>
                            </div>

                            <div className="calendar-day">
                                <span className="calendar-day-label">
                                    Vie
                                </span>

                                <span className="calendar-day-number">
                                    20
                                </span>
                            </div>

                            <div className="calendar-day">
                                <span className="calendar-day-label">
                                    Sáb
                                </span>

                                <span className="calendar-day-number">
                                    21
                                </span>
                            </div>

                            <div className="calendar-day">
                                <span className="calendar-day-label">
                                    Dom
                                </span>

                                <span className="calendar-day-number">
                                    22
                                </span>
                            </div>

                        </div>


                        {/* CUERPO */}
                        <div className="calendar-body">

                            <div className="calendar-grid">

                                {/* 08:00 */}
                                <div className="calendar-row">

                                    <div className="calendar-time">
                                        08:00
                                    </div>

                                    <div className="calendar-cell"></div>

                                    <div className="calendar-cell today">

                                        <div className="calendar-appointment appointment-confirmed">

                                            <div className="appointment-status">
                                                <span className="appointment-dot"></span>
                                                Confirmada
                                            </div>

                                            <h4 className="appointment-name">
                                                Juan Pérez
                                            </h4>

                                            <p className="appointment-vehicle">
                                                Toyota Hilux • ABC-123
                                            </p>

                                            <div className="appointment-technician">
                                                <span className="material-symbols-outlined">
                                                    build
                                                </span>

                                                Rev. 50k - Carlos M.
                                            </div>

                                        </div>

                                    </div>

                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>

                                </div>


                                {/* 09:00 */}
                                <div className="calendar-row">

                                    <div className="calendar-time">
                                        09:00
                                    </div>

                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell today"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>

                                </div>


                                {/* 10:00 */}
                                <div className="calendar-row">

                                    <div className="calendar-time">
                                        10:00
                                    </div>

                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell today"></div>

                                    <div className="calendar-cell">

                                        <div className="calendar-appointment appointment-pending">

                                            <div className="appointment-status">
                                                <span className="appointment-dot"></span>
                                                Pendiente
                                            </div>

                                            <h4 className="appointment-name">
                                                María G.
                                            </h4>

                                            <p className="appointment-vehicle">
                                                Honda Civic
                                            </p>

                                        </div>

                                    </div>

                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>

                                </div>


                                {/* 11:00 */}
                                <div className="calendar-row">

                                    <div className="calendar-time">
                                        11:00
                                    </div>

                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell today"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>

                                </div>


                                {/* 12:00 */}
                                <div className="calendar-row">

                                    <div className="calendar-time">
                                        12:00
                                    </div>

                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell today"></div>
                                    <div className="calendar-cell"></div>

                                    <div className="calendar-cell">

                                        <div className="calendar-appointment appointment-urgent">

                                            <div className="appointment-status">
                                                <span className="appointment-dot"></span>
                                                Urgente
                                            </div>

                                            <h4 className="appointment-name">
                                                Empresa X
                                            </h4>

                                            <p className="appointment-vehicle">
                                                Ford Transit • XYZ-987
                                            </p>

                                            <div className="appointment-technician">

                                                <span className="material-symbols-outlined">
                                                    warning
                                                </span>

                                                Frenos - Ana P.

                                            </div>

                                        </div>

                                    </div>

                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>

                                </div>


                                {/* 13:00 */}
                                <div className="calendar-row">

                                    <div className="calendar-time">
                                        13:00
                                    </div>

                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell today"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>

                                </div>


                                {/* 14:00 */}
                                <div className="calendar-row">

                                    <div className="calendar-time">
                                        14:00
                                    </div>

                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell today"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>

                                </div>


                                {/* 15:00 */}
                                <div className="calendar-row">

                                    <div className="calendar-time">
                                        15:00
                                    </div>

                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell today"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>
                                    <div className="calendar-cell"></div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </main>


            {/* OVERLAY */}
            <div
                className={`appointment-overlay ${showNewAppointment ? "open" : ""}`}
                onClick={() => setShowNewAppointment(false)}
            ></div>


            {/* NUEVA CITA / NUEVO CLIENTE SIDEBAR */}
            <aside
                className={`new-appointment-sidebar ${showNewAppointment ? "open" : ""}`}
                style={{ width: '420px', maxWidth: '90vw' }}
            >

                <div className="new-appointment-header">

                    <h3>
                        Nueva Cita Programada
                    </h3>

                    <button
                        className="new-appointment-close"
                        onClick={() => setShowNewAppointment(false)}
                    >
                        <span className="material-symbols-outlined">
                            close
                        </span>
                    </button>

                </div>


                <div className="new-appointment-body">

                    {/* CLIENTE & SUB-FORMULARIO NUEVO CLIENTE */}
                    <div className="form-section">

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h4 className="form-section-title" style={{ margin: 0 }}>
                                <span className="material-symbols-outlined">person</span>
                                Cliente
                            </h4>
                            <button 
                                type="button" 
                                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                                onClick={() => setEsNuevoCliente(!esNuevoCliente)}
                            >
                                {esNuevoCliente ? "🔍 Buscar Cliente" : "+ Nuevo Cliente"}
                            </button>
                        </div>

                        {!esNuevoCliente ? (
                            <div className="form-field">
                                <label>Seleccionar Cliente Existente</label>
                                <input
                                    type="text"
                                    placeholder="Buscar por DNI, RUC o Nombre..."
                                    defaultValue="Carlos Mendoza (DNI: 45892341)"
                                />
                            </div>
                        ) : (
                            <div className="sub-form-nuevo-cliente" style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                                <div className="form-field">
                                    <label>Tipo de Cliente</label>
                                    <select value={tipoCliente} onChange={(e) => setTipoCliente(e.target.value)}>
                                        <option value="Natural">Persona Natural</option>
                                        <option value="Empresa">Empresa</option>
                                    </select>
                                </div>

                                <div className="form-grid">
                                    <div className="form-field">
                                        <label>{tipoCliente === "Natural" ? "DNI" : "RUC"}</label>
                                        <input type="text" placeholder={tipoCliente === "Natural" ? "8 dígitos" : "11 dígitos"} />
                                    </div>

                                    <div className="form-field">
                                        <label>{tipoCliente === "Natural" ? "Nombres" : "Razón Social"}</label>
                                        <input type="text" placeholder="Ingrese nombre..." />
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="form-field">
                                        <label>Email</label>
                                        <input type="email" placeholder="correo@ejemplo.com" />
                                    </div>
                                    <div className="form-field">
                                        <label>Celular</label>
                                        <input type="tel" placeholder="+51 987..." />
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label>Dirección (Ubigeo - Auto-guardado de última ubicación)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginTop: '4px' }}>
                                        <input type="text" value={ubigeoDept} onChange={(e) => setUbigeoDept(e.target.value)} placeholder="Departamento" />
                                        <input type="text" value={ubigeoProv} onChange={(e) => setUbigeoProv(e.target.value)} placeholder="Provincia" />
                                        <input type="text" value={ubigeoDist} onChange={(e) => setUbigeoDist(e.target.value)} placeholder="Distrito" />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>


                    {/* VEHÍCULO */}
                    <div className="form-section">

                        <h4 className="form-section-title">
                            <span className="material-symbols-outlined">
                                directions_car
                            </span>
                            Vehículo
                        </h4>

                        <div className="form-grid">

                            <div className="form-field">
                                <label>Modelo / Marca</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Toyota Corolla"
                                    defaultValue="Toyota Corolla 2021"
                                />
                            </div>

                            <div className="form-field">
                                <label>Placa</label>
                                <input
                                    type="text"
                                    placeholder="ABC-123"
                                    defaultValue="ABC-123"
                                />
                            </div>

                        </div>

                    </div>


                    {/* SERVICIO & DURACIÓN */}
                    <div className="form-section">

                        <h4 className="form-section-title">
                            <span className="material-symbols-outlined">
                                build_circle
                            </span>
                            Detalles de la Cita
                        </h4>

                        <div className="form-grid">

                            <div className="form-field">
                                <label>Fecha</label>
                                <input type="date" defaultValue="2026-08-23" />
                            </div>

                            <div className="form-field">
                                <label>Hora de Inicio</label>
                                <input type="time" defaultValue="09:00" />
                            </div>

                        </div>

                        <div className="form-grid">
                            <div className="form-field">
                                <label>Duración Estimada (Por defecto 3 horas)</label>
                                <input 
                                    type="number" 
                                    value={duracionHoras}
                                    onChange={(e) => setDuracionHoras(e.target.value)}
                                    placeholder="3" 
                                />
                            </div>

                            <div className="form-field">
                                <label>Técnico Asignado</label>
                                <select>
                                    <option>Carlos M.</option>
                                    <option>Ana P.</option>
                                    <option>Luis García</option>
                                </select>
                            </div>
                        </div>


                        <div className="form-field">
                            <label>Comentarios / Observaciones de la Cita</label>
                            <textarea
                                rows="3"
                                placeholder="Indique observaciones generales para la recepción..."
                                defaultValue="Mantenimiento de 80,000 km y revisión de frenos."
                            ></textarea>
                        </div>

                    </div>

                </div>


                {/* FOOTER */}
                <div className="new-appointment-footer">

                    <button
                        className="cancel-button"
                        onClick={() => setShowNewAppointment(false)}
                    >
                        Cancelar
                    </button>

                    <button 
                        className="save-button"
                        onClick={() => {
                            alert("¡Cita agendada correctamente! Notificación enviada automáticamente al cliente por WhatsApp y Mail.");
                            setShowNewAppointment(false);
                        }}
                    >
                        <span className="material-symbols-outlined">
                            send
                        </span>
                        Agendar & Notificar Cliente
                    </button>

                </div>

            </aside>

        </div>
    );
}

export default Citas;