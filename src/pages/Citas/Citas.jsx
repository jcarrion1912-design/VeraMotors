import { useState } from "react";
import "./Citas.css";

function Citas() {
    const [showNewAppointment, setShowNewAppointment] = useState(false);

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


            {/* NUEVA CITA */}
            <aside
                className={`new-appointment-sidebar ${showNewAppointment ? "open" : ""}`}
            >

                <div className="new-appointment-header">

                    <h3>
                        Nueva Cita
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

                    {/* CLIENTE */}
                    <div className="form-section">

                        <h4 className="form-section-title">

                            <span className="material-symbols-outlined">
                                person
                            </span>

                            Cliente

                        </h4>

                        <div className="form-field">

                            <label>
                                Nombre Completo
                            </label>

                            <input
                                type="text"
                                placeholder="Ej. Juan Pérez"
                            />

                        </div>

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

                                <label>
                                    Modelo / Marca
                                </label>

                                <input
                                    type="text"
                                    placeholder="Ej. Toyota Corolla"
                                />

                            </div>

                            <div className="form-field">

                                <label>
                                    Placa
                                </label>

                                <input
                                    type="text"
                                    placeholder="ABC-123"
                                />

                            </div>

                        </div>

                    </div>


                    {/* SERVICIO */}
                    <div className="form-section">

                        <h4 className="form-section-title">

                            <span className="material-symbols-outlined">
                                build_circle
                            </span>

                            Detalles del Servicio

                        </h4>

                        <div className="form-grid">

                            <div className="form-field">

                                <label>
                                    Fecha
                                </label>

                                <input type="date" />

                            </div>

                            <div className="form-field">

                                <label>
                                    Hora
                                </label>

                                <input type="time" />

                            </div>

                        </div>


                        <div className="form-field">

                            <label>
                                Técnico Asignado
                            </label>

                            <select>

                                <option>
                                    Sin asignar
                                </option>

                                <option>
                                    Carlos M.
                                </option>

                                <option>
                                    Ana P.
                                </option>

                            </select>

                        </div>


                        <div className="form-field">

                            <label>
                                Descripción
                            </label>

                            <textarea
                                rows="3"
                                placeholder="Describa el motivo de la cita..."
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

                    <button className="save-button">

                        <span className="material-symbols-outlined">
                            save
                        </span>

                        Guardar Cita

                    </button>

                </div>

            </aside>

        </div>
    );
}

export default Citas;